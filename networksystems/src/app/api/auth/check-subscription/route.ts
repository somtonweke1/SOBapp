import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function GET(request: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_email || session.customer_details?.email;

    if (!email) {
      return NextResponse.json({ subscribed: false, email: null });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { hasSignedAgreement: true },
    });

    return NextResponse.json({ hasSignedAgreement: Boolean(user?.hasSignedAgreement), email });
  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 });
  }
}
