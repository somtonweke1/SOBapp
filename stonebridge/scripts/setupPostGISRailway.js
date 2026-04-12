const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function setupPostGIS() {
  console.log('Setting up PostGIS on Railway PostgreSQL...\n');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✓ Connected to Railway PostgreSQL');

    // Read the PostGIS setup SQL
    const sqlPath = path.join(__dirname, '..', 'PRODUCTION_POSTGIS_SETUP.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`\nExecuting ${statements.length} SQL statements...\n`);

    for (const statement of statements) {
      if (!statement) continue;

      try {
        await prisma.$executeRawUnsafe(statement);
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`✓ ${preview}...`);
      } catch (error) {
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`✗ ${preview}...`);
        console.log(`  Error: ${error.message}`);

        // Continue on errors - some might be expected (e.g., extension already exists)
        if (error.message.includes('already exists')) {
          console.log(`  (Continuing - already exists)`);
        }
      }
    }

    // Verify PostGIS is installed
    console.log('\nVerifying PostGIS installation...');
    try {
      const result = await prisma.$queryRaw`SELECT PostGIS_version();`;
      console.log('✓ PostGIS version:', result[0].postgis_version);
    } catch (error) {
      console.log('✗ PostGIS not available:', error.message);
      console.log('\n⚠️  PostGIS extension may not be available in Railway PostgreSQL');
      console.log('   Recommendation: Use Supabase or Neon (both have PostGIS built-in)');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n✗ Setup failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

setupPostGIS();
