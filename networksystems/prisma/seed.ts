import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create test user
  const hashedPassword = await bcrypt.hash('Test1234', 12);

  const testUser = await prisma.user.upsert({
    where: { email: 'admin@miar.com' },
    update: {},
    create: {
      email: 'admin@miar.com',
      name: 'SOBapp Admin',
      hashedPassword,
      role: 'admin',
      company: 'SOBapp Platform',
      phone: '+1 (555) 123-4567',
      subscription: 'enterprise',
      permissions: JSON.stringify(['*']), // Full access
      isActive: true,
    },
  });

  console.log('Created test user:', {
    email: testUser.email,
    name: testUser.name,
    role: testUser.role,
  });

  // Create additional test users
  const managerPassword = await bcrypt.hash('Manager1234', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@miar.com' },
    update: {},
    create: {
      email: 'manager@miar.com',
      name: 'Sarah Manager',
      hashedPassword: managerPassword,
      role: 'manager',
      company: 'Test Mining Corp',
      subscription: 'professional',
      permissions: JSON.stringify(['read:all', 'write:own', 'manage:team']),
      isActive: true,
    },
  });

  console.log('Created manager user:', {
    email: manager.email,
    name: manager.name,
    role: manager.role,
  });

  const userPassword = await bcrypt.hash('User1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@miar.com' },
    update: {},
    create: {
      email: 'user@miar.com',
      name: 'John User',
      hashedPassword: userPassword,
      role: 'user',
      company: 'Demo Company',
      subscription: 'starter',
      permissions: JSON.stringify(['read:own', 'write:own']),
      isActive: true,
    },
  });

  console.log('Created standard user:', {
    email: user.email,
    name: user.name,
    role: user.role,
  });

  console.log('\n===== Test Credentials =====');
  console.log('Admin:');
  console.log('  Email: admin@miar.com');
  console.log('  Password: Test1234');
  console.log('\nManager:');
  console.log('  Email: manager@miar.com');
  console.log('  Password: Manager1234');
  console.log('\nUser:');
  console.log('  Email: user@miar.com');
  console.log('  Password: User1234');
  console.log('============================\n');

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
