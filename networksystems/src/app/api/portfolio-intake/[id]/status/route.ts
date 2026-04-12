import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const bodySchema = z.object({
  status: z.enum(['new', 'in_review', 'delivered']),
});

function parseDetails(value: string | null) {
  if (!value) return {};

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = paramsSchema.parse(context.params);
    const { status } = bodySchema.parse(await request.json());

    const existing = await prisma.auditLog.findUnique({
      where: { id },
      select: { id: true, resource: true, details: true, timestamp: true },
    });

    if (!existing || existing.resource !== 'portfolio_intake') {
      return NextResponse.json({ error: 'Portfolio intake not found' }, { status: 404 });
    }

    const nextDetails = {
      ...parseDetails(existing.details),
      status,
    };

    const updated = await prisma.auditLog.update({
      where: { id },
      data: {
        details: JSON.stringify(nextDetails),
      },
      select: {
        id: true,
        resource: true,
        details: true,
        timestamp: true,
      },
    });

    return NextResponse.json({
      ok: true,
      record: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid status update',
      },
      { status: 400 }
    );
  }
}
