import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();

    // Check if PFAS tables exist
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'PFAS%'
    `;

    return NextResponse.json({
      success: true,
      message: 'PFAS module database check',
      database: 'Connected ✅',
      tables: tableCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      database: 'Connection failed ❌'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
