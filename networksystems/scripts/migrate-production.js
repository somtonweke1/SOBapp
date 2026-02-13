#!/usr/bin/env node

/**
 * Defensive production migration runner for Vercel deployments.
 * Handles stuck/partial Prisma migration states without blocking deploy
 * when the live schema is already correct.
 */

const { spawnSync } = require('child_process');

const DATABASE_URL = process.env.DATABASE_URL;
const FAILED_MIGRATION_ID = '20251015191405_init';

function runPrisma(args, options = {}) {
  const result = spawnSync('npx', ['prisma', ...args], {
    env: process.env,
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe'
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error || null
  };
}

function outputOf(result) {
  return `${result.stdout}\n${result.stderr}`.trim();
}

function shouldSkipMigrations() {
  const value = (process.env.SKIP_MIGRATIONS || '').toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function resolveKnownFailedMigration() {
  console.log(`🔧 Attempting to resolve failed migration (${FAILED_MIGRATION_ID})...`);

  const result = runPrisma(['migrate', 'resolve', '--applied', FAILED_MIGRATION_ID]);
  const output = outputOf(result).toLowerCase();

  if (result.ok) {
    console.log(`✅ Marked ${FAILED_MIGRATION_ID} as applied`);
    return true;
  }

  const benign =
    output.includes('already recorded as applied') ||
    output.includes('already applied') ||
    output.includes('not found') ||
    output.includes('no migration found');

  if (benign) {
    console.log('ℹ️ Migration already resolved or not present');
    return true;
  }

  console.warn('⚠️ Failed migration could not be resolved automatically');
  if (result.error) {
    console.warn(`   ${result.error.message}`);
  } else if (output) {
    console.warn(`   ${output}`);
  }

  return false;
}

function checkSchemaUpToDate() {
  const result = runPrisma([
    'migrate',
    'diff',
    '--from-url',
    DATABASE_URL,
    '--to-schema-datamodel',
    'prisma/schema.prisma',
    '--exit-code'
  ]);

  if (result.status === 0) {
    return { upToDate: true, unknown: false, details: 'No schema differences detected' };
  }

  if (result.status === 2) {
    return { upToDate: false, unknown: false, details: 'Schema differences detected' };
  }

  return {
    upToDate: false,
    unknown: true,
    details: outputOf(result) || 'Unable to determine schema status'
  };
}

function deployMigrations() {
  console.log('🚀 Running `prisma migrate deploy`...');

  const result = runPrisma(['migrate', 'deploy'], { inherit: true });

  if (result.ok) {
    console.log('✅ Migration deploy completed');
    return true;
  }

  const output = outputOf(result).toLowerCase();

  if (output.includes('already applied') || output.includes('no pending migrations')) {
    console.log('✅ No pending work: migrations already applied');
    return true;
  }

  console.warn('⚠️ Migration deploy reported an error');
  return false;
}

function generateClient() {
  console.log('📦 Generating Prisma Client...');

  const result = runPrisma(['generate'], { inherit: true });

  if (result.ok) {
    console.log('✅ Prisma Client generated');
    return true;
  }

  console.error('❌ Prisma Client generation failed');
  return false;
}

function main() {
  console.log('🔍 Starting production migration process...');

  if (shouldSkipMigrations()) {
    console.log('⏭️ SKIP_MIGRATIONS is set, skipping migration step');
    process.exit(0);
  }

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  if (DATABASE_URL.startsWith('file:')) {
    console.log('📁 SQLite DATABASE_URL detected, skipping production migrations');
    process.exit(0);
  }

  console.log('🗄️ Production database detected');

  const statusResult = runPrisma(['migrate', 'status']);
  const statusOutput = outputOf(statusResult).toLowerCase();

  if (statusOutput.includes(FAILED_MIGRATION_ID.toLowerCase()) && statusOutput.includes('failed')) {
    resolveKnownFailedMigration();
  }

  console.log('🔍 Checking whether schema is already up-to-date...');
  const beforeDeploy = checkSchemaUpToDate();

  if (beforeDeploy.upToDate) {
    console.log('✅ Database schema is already in sync');
    if (!generateClient()) {
      process.exit(1);
    }
    process.exit(0);
  }

  if (beforeDeploy.unknown) {
    console.warn(`⚠️ Could not determine schema status: ${beforeDeploy.details}`);
  } else {
    console.log('ℹ️ Schema changes detected, deploying migrations');
  }

  let deployed = deployMigrations();

  if (!deployed) {
    const deployRetryHint = runPrisma(['migrate', 'status']);
    const retryOutput = outputOf(deployRetryHint).toLowerCase();

    if (retryOutput.includes('p3009') || retryOutput.includes(FAILED_MIGRATION_ID.toLowerCase())) {
      console.log('🔁 Detected failed migration state, attempting targeted resolve + retry');
      resolveKnownFailedMigration();
      deployed = deployMigrations();
    }
  }

  if (!deployed) {
    console.log('🔎 Re-checking schema after migration errors...');
    const afterDeploy = checkSchemaUpToDate();

    if (!afterDeploy.upToDate) {
      console.error('❌ Migration deploy failed and schema is not up-to-date');
      console.error('📝 Manual intervention may be required:');
      console.error('  1. Delete stuck row in _prisma_migrations for 20251015191405_init');
      console.error('  2. Or run: npx prisma migrate resolve --applied 20251015191405_init');
      console.error('  3. Verify DATABASE_URL and DB connectivity from Vercel');
      process.exit(1);
    }

    console.log('✅ Schema is valid despite migration history warning; continuing');
  }

  if (!generateClient()) {
    process.exit(1);
  }

  console.log('🎉 Migration process completed successfully');
}

try {
  main();
} catch (error) {
  console.error('❌ Unexpected error during migration process:', error.message);
  process.exit(1);
}
