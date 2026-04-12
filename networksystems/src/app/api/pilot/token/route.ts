import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPilotToken, pilotTokenSchema } from '@/lib/pilot';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const payload = pilotTokenSchema.parse(await request.json());
    const token = createPilotToken();

    await prisma.pilotAccessToken.create({
      data: {
        token,
        institution_name: payload.institution_name,
        contact_email: payload.contact_email.toLowerCase(),
      },
    });

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      ok: true,
      token,
      url: `${origin}/pilot?token=${token}`,
    });
  } catch (error) {
    console.error('Pilot token creation error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to create pilot token' }, { status: 400 });
  }
}
