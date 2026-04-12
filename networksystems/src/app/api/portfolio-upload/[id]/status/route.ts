import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { statusToEnum, type PortfolioUploadStatus } from '@/lib/portfolio-upload';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = (await request.json()) as { status?: PortfolioUploadStatus };
    if (!params.id || !payload.status || !['received', 'processing', 'delivered'].includes(payload.status)) {
      return NextResponse.json({ ok: false, error: 'Invalid status update' }, { status: 400 });
    }

    const updated = await prisma.portfolioUpload.update({
      where: { id: params.id },
      data: {
        status: statusToEnum(payload.status),
      },
    });

    return NextResponse.json({
      ok: true,
      status: updated.status,
    });
  } catch (error) {
    console.error('Portfolio upload status update error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update status' }, { status: 400 });
  }
}
