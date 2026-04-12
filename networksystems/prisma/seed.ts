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

  const db = prisma as any;
  const seededLoops = [
    {
      id: 'loop-baltimore-utility-leakage',
      signature: 'Baltimore Utility Leakage Loop::FINANCIAL',
      type: 'FINANCIAL',
      status: 'ACTIVE',
      tensionScore: 11.4,
      vendor: 'Baltimore Utility Leakage Loop',
      agency: 'DPW',
      jurisdiction: 'Baltimore City',
      exposure: 620000,
      signals: JSON.stringify([
        {
          id: 'seed-signal-1',
          indicator: 'Late fee and statutory interest concentration',
          severity: 'HIGH',
          basis: 'RISK_HEURISTIC',
          exposure: 620000,
        },
      ]),
    },
    {
      id: 'loop-entity-opacity-multi-alias',
      signature: 'Entity Opacity Multi Alias::ENTITY_OPACITY',
      type: 'ENTITY_OPACITY',
      status: 'ACTIVE',
      tensionScore: 9.8,
      vendor: 'Entity Opacity Multi Alias',
      agency: 'DGS',
      jurisdiction: 'Maryland State',
      exposure: 410000,
      signals: JSON.stringify([
        {
          id: 'seed-signal-2',
          indicator: 'Alias masking across vendor identity graph',
          severity: 'HIGH',
          basis: 'STRICT_LAW',
          exposure: 410000,
        },
      ]),
    },
    {
      id: 'loop-regulator-process-bottleneck',
      signature: 'Regulator Process Bottleneck::REGULATOR_PROCESS',
      type: 'REGULATOR_PROCESS',
      status: 'ACTIVE',
      tensionScore: 8.9,
      vendor: 'Regulator Process Bottleneck',
      agency: 'DoIT',
      jurisdiction: 'Maryland State',
      exposure: 290000,
      signals: JSON.stringify([
        {
          id: 'seed-signal-3',
          indicator: 'Emergency procurement rollover beyond expected window',
          severity: 'MEDIUM',
          basis: 'STRICT_LAW',
          exposure: 290000,
        },
      ]),
    },
  ];

  for (const loop of seededLoops) {
    try {
      await db.constraintLoop.upsert({
        where: { signature: loop.signature },
        update: loop,
        create: loop,
      });
    } catch (error) {
      console.error(`Failed seeding loop ${loop.signature}:`, error);
    }
  }

  const seededInterventions = [
    {
      id: 'bridge-seed-financial-1',
      type: 'PROCESS',
      status: 'COMPLETED',
      targetLoopId: 'loop-baltimore-utility-leakage',
      playbookSteps: JSON.stringify([
        { id: 's-1', title: 'Invoice stream normalization' },
        { id: 's-2', title: 'Penalty window prediction' },
      ]),
      expectedDelta: 210000,
      actualDelta: 182000,
      timeToBridgeHours: 38.5,
      deployedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    },
    {
      id: 'bridge-seed-entity-1',
      type: 'DATA',
      status: 'COMPLETED',
      targetLoopId: 'loop-entity-opacity-multi-alias',
      playbookSteps: JSON.stringify([
        { id: 's-1', title: 'Entity alias resolution' },
        { id: 's-2', title: 'Ownership path verification' },
      ]),
      expectedDelta: 102000,
      actualDelta: 93000,
      timeToBridgeHours: 26.2,
      deployedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
  ];

  for (const intervention of seededInterventions) {
    try {
      await db.bridgeIntervention.upsert({
        where: { id: intervention.id },
        update: intervention,
        create: intervention,
      });
    } catch (error) {
      console.error(`Failed seeding bridge ${intervention.id}:`, error);
    }
  }

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
