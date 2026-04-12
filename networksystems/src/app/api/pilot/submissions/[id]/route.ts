import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = (await request.json()) as { status?: 'new' | 'delivered' };
    if (!params.id || !payload.status || !['new', 'delivered'].includes(payload.status)) {
      return NextResponse.json({ ok: false, error: 'Invalid submission update' }, { status: 400 });
    }

    const existing = await prisma.auditLog.findUnique({
      where: { id: params.id },
      select: { details: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Submission not found' }, { status: 404 });
    }

    const details = existing.details ? JSON.parse(existing.details) as Record<string, unknown> : {};
    const nextDetails = {
      ...details,
      status: payload.status,
      deliveredAt: payload.status === 'delivered' ? new Date().toISOString() : undefined,
    };

    await prisma.auditLog.update({
      where: { id: params.id },
      data: {
        details: JSON.stringify(nextDetails),
      },
    });

    if (payload.status === 'delivered' && typeof details.pilotEngagementId === 'string') {
      await prisma.pilotEngagement.update({
        where: { id: details.pilotEngagementId },
        data: {
          deals_delivered: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json({ ok: true, status: payload.status });
  } catch (error) {
    console.error('Pilot submission update error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update pilot submission' }, { status: 400 });
  }
}
