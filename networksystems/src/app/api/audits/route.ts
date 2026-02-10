import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      meterReadCurrent,
      meterReadLast,
      totalBill,
      serviceCharge,
      sewerCharge,
      expectedBill,
      discrepancyAmount,
      errorPercentage,
      severity,
      recommendation,
    } = body;

    if (
      typeof meterReadCurrent !== 'number' ||
      typeof meterReadLast !== 'number' ||
      typeof totalBill !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const audit = await prisma.waterAudit.create({
      data: {
        userId: session.user.id,
        meterReadCurrent,
        meterReadLast,
        totalBill,
        serviceCharge,
        sewerCharge,
        expectedBill,
        discrepancyAmount,
        errorPercentage,
        severity,
        recommendation,
      },
    });

    return NextResponse.json({ success: true, audit });
  } catch (error) {
    console.error('Audit save error:', error);
    return NextResponse.json({ error: 'Failed to save audit' }, { status: 500 });
  }
}
