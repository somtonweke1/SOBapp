import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServiceOffer, type ServiceIntakeDetails } from '@/lib/service-intake';

export const runtime = 'nodejs';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const intakeSchema = z.object({
  offerId: z.string().min(1),
  company: z.string().min(2).max(160),
  contactName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional().or(z.literal('')),
  assetAddress: z.string().min(5).max(200),
  assetType: z.string().max(80).optional().or(z.literal('')),
  timeline: z.string().max(160).optional().or(z.literal('')),
  goals: z.string().min(10).max(2000),
  previewAgency: z.string().max(160).optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const payload = intakeSchema.parse(await request.json());
    const offer = getServiceOffer(payload.offerId);

    if (!offer) {
      return NextResponse.json({ error: 'Unknown service offer' }, { status: 400 });
    }

    const details: ServiceIntakeDetails = {
      offerId: offer.id,
      offerName: offer.name,
      amountCents: offer.amountCents,
      company: payload.company.trim(),
      contactName: payload.contactName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() || undefined,
      assetAddress: payload.assetAddress.trim(),
      assetType: payload.assetType?.trim() || undefined,
      timeline: payload.timeline?.trim() || undefined,
      goals: payload.goals.trim(),
      previewAgency: payload.previewAgency?.trim() || undefined,
      paymentStatus: stripeSecretKey ? 'pending' : 'manual_follow_up',
      createdAt: new Date().toISOString(),
    };

    const intake = await prisma.auditLog.create({
      data: {
        action: 'service_intake_created',
        resource: 'service_intake',
        details: JSON.stringify(details),
      },
    });

    if (!stripeSecretKey) {
      return NextResponse.json({
        ok: true,
        mode: 'manual',
        intakeId: intake.id,
        message: 'Stripe is not configured. Follow up with this client manually.',
      });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: details.email,
      success_url: `${origin}/free-scan/success?session_id={CHECKOUT_SESSION_ID}&intake=${intake.id}`,
      cancel_url: `${origin}/free-scan?checkout=cancelled`,
      metadata: {
        intakeId: intake.id,
        offerId: offer.id,
        assetAddress: details.assetAddress,
      },
      payment_intent_data: {
        metadata: {
          intakeId: intake.id,
          offerId: offer.id,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: offer.amountCents,
            product_data: {
              name: offer.name,
              description: offer.summary,
            },
          },
        },
      ],
    });

    await prisma.auditLog.update({
      where: { id: intake.id },
      data: {
        details: JSON.stringify({
          ...details,
          checkoutSessionId: session.id,
          checkoutUrl: session.url ?? undefined,
        }),
      },
    });

    return NextResponse.json({
      ok: true,
      mode: 'stripe',
      intakeId: intake.id,
      url: session.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid intake payload',
          issues: error.issues.map((issue) => issue.message),
        },
        { status: 400 }
      );
    }

    console.error('Service intake checkout error:', error);
    return NextResponse.json({ error: 'Failed to create intake checkout' }, { status: 500 });
  }
}
