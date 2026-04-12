const { PrismaClient } = require('@prisma/client');

async function enablePostGIS() {
  console.log('Enabling PostGIS extension on Railway PostgreSQL...');

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✓ Connected to Railway PostgreSQL');

    // Enable PostGIS extension
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('✓ PostGIS extension enabled');

    // Verify PostGIS is working
    const result = await prisma.$queryRaw`SELECT PostGIS_version();`;
    console.log('✓ PostGIS version:', result[0].postgis_version);

    await prisma.$disconnect();
    console.log('\n✓ PostGIS setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('✗ PostGIS setup failed:');
    console.error('  Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

enablePostGIS();
