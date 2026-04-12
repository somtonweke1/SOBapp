import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = (await request.json()) as { notes?: string; feedbackCollected?: boolean; pilotStatus?: 'active' | 'paused' | 'completed' };
    if (!params.id) {
      return NextResponse.json({ ok: false, error: 'Missing engagement id' }, { status: 400 });
    }

    const updated = await prisma.pilotEngagement.update({
      where: { id: params.id },
      data: {
        ...(typeof payload.notes === 'string' ? { notes: payload.notes.trim() || null } : {}),
        ...(typeof payload.feedbackCollected === 'boolean' ? { feedback_collected: payload.feedbackCollected } : {}),
        ...(payload.pilotStatus
          ? {
              pilot_status:
                payload.pilotStatus === 'paused'
                  ? 'PAUSED'
                  : payload.pilotStatus === 'completed'
                    ? 'COMPLETED'
                    : 'ACTIVE',
            }
          : {}),
      },
    });

    return NextResponse.json({ ok: true, engagement: updated });
  } catch (error) {
    console.error('Pilot engagement update error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update pilot engagement' }, { status: 400 });
  }
}
