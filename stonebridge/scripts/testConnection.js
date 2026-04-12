const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✓ Database connected successfully');

    // Try a simple query
    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    console.log('✓ Query successful:', result);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Database connection failed:');
    console.error('  Error:', error.message);
    console.error('  Code:', error.code);
    process.exit(1);
  }
}

testConnection();
