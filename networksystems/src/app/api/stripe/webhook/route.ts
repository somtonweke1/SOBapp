import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function parseDetails(value: string | null) {
  if (!value) return {};

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature error:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.customer as string | null;
    const email = session.customer_email || session.customer_details?.email;
    const intakeId = session.metadata?.intakeId;

    if (intakeId) {
      try {
        const intake = await prisma.auditLog.findUnique({
          where: { id: intakeId },
          select: { details: true },
        });

        await prisma.auditLog.update({
          where: { id: intakeId },
          data: {
            details: JSON.stringify({
              ...parseDetails(intake?.details ?? null),
              paymentStatus: 'paid',
              paymentCompletedAt: new Date().toISOString(),
              checkoutSessionId: session.id,
              stripeCustomerId: customerId ?? undefined,
            }),
          },
        });
      } catch (error) {
        console.error('Failed to update intake payment status:', error);
        return NextResponse.json({ error: 'Failed to update intake' }, { status: 500 });
      }
    }

    if (email) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (existingUser) {
          await prisma.user.update({
            where: { email },
            data: {
              hasSignedAgreement: true,
              subscription: 'professional',
              stripeCustomerId: customerId ?? undefined,
            },
          });
        }
      } catch (error) {
        console.error('Failed to update subscription:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
