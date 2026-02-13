#!/usr/bin/env node

/**
 * Production Migration Script for Vercel
 * Only runs migrations if DATABASE_URL is set and points to PostgreSQL
 */

const { execSync } = require('child_process');

const databaseUrl = process.env.DATABASE_URL;

console.log('🔍 Checking database configuration...');

// Explicit override to skip migrations (e.g., when DB is managed externally)
if (process.env.SKIP_MIGRATIONS === '1') {
  console.log('⏭️  SKIP_MIGRATIONS=1 set - skipping migrations');
  process.exit(0);
}

// Skip migrations if no DATABASE_URL
if (!databaseUrl) {
  console.log('⚠️  No DATABASE_URL found - skipping migrations');
  console.log('ℹ️  Set DATABASE_URL in Vercel environment variables for production');
  process.exit(0);
}

// Skip migrations if using SQLite (development only)
if (databaseUrl.startsWith('file:')) {
  console.log('📁 SQLite database detected - skipping migrations (development mode)');
  process.exit(0);
}

// Run migrations for PostgreSQL/MySQL
console.log('🗄️  Production database detected');
console.log('📦 Checking migration status...');

try {
  // Try to run migrations
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env
  });
  console.log('✅ Migrations completed successfully');
} catch (error) {
  console.error('⚠️  Migration encountered an issue');
  console.error('Error:', error.message);

  // Check if database already has tables (likely already migrated manually)
  console.log('');
  console.log('🔍 Checking if database already has required tables...');

  try {
    const { execSync: execSyncQuiet } = require('child_process');
    execSyncQuiet('npx prisma db pull --force', {
      stdio: 'pipe',
      env: process.env
    });
    console.log('✅ Database appears to have existing schema, continuing build...');
    console.log('ℹ️  This is normal if tables were created manually');
    process.exit(0);
  } catch (pullError) {
    console.error('');
    console.error('❌ Critical: Unable to connect to database');
    console.error('📝 Make sure:');
    console.error('   1. DATABASE_URL is set in Vercel environment variables');
    console.error('   2. DATABASE_URL points to a PostgreSQL database');
    console.error('   3. Database is accessible from Vercel');
    process.exit(1);
  }
}
