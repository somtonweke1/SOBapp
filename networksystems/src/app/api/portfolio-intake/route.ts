import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildPortfolioReferenceNumber,
  portfolioIntakeSchema,
  type PortfolioIntakeDetails,
} from '@/lib/portfolio-intake';

export const runtime = 'nodejs';

async function sendConfirmationEmail(details: PortfolioIntakeDetails) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log('Portfolio intake confirmation email skipped: RESEND_API_KEY not set', details);
    return 'not_configured' as const;
  }

  const from = process.env.RESEND_FROM_EMAIL || 'StoneBridge <onboarding@resend.dev>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [details.email],
      subject: `StoneBridge portfolio screening request received (${details.referenceNumber})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #18181b;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">Portfolio screening request received</h1>
          <p style="line-height: 1.6;">
            StoneBridge received your institutional portfolio screening request. We use this intake to frame
            underwriting review, structural risk screening, and portfolio-level diligence before capital is deployed.
          </p>
          <div style="margin: 24px 0; padding: 20px; border: 1px solid #e4e4e7; border-radius: 16px; background: #fafafa;">
            <p style="margin: 0 0 8px;"><strong>Reference:</strong> ${details.referenceNumber}</p>
            <p style="margin: 0 0 8px;"><strong>Institution:</strong> ${details.institutionName}</p>
            <p style="margin: 0 0 8px;"><strong>Deal type:</strong> ${details.dealType}</p>
            <p style="margin: 0;"><strong>Requested turnaround:</strong> ${details.turnaround}</p>
          </div>
          <p style="line-height: 1.6;">
            Properties submitted: ${details.propertyAddresses.length}
          </p>
          <p style="line-height: 1.6;">
            A StoneBridge operator will review the request and follow up using the contact information provided.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${response.status} ${errorText}`);
  }

  return 'sent' as const;
}

export async function POST(request: NextRequest) {
  try {
    const rawPayload = await request.json();
    const payload = portfolioIntakeSchema.parse({
      ...rawPayload,
      propertyAddresses: Array.isArray(rawPayload?.propertyAddresses)
        ? rawPayload.propertyAddresses.filter(
            (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
          )
        : [],
    });

    const createdAt = new Date();
    const intake = await prisma.auditLog.create({
      data: {
        action: 'portfolio_intake_created',
        resource: 'portfolio_intake',
        details: JSON.stringify({
          ...payload,
          type: 'portfolio_intake',
          createdAt: createdAt.toISOString(),
        }),
        timestamp: createdAt,
      },
    });

    const referenceNumber = buildPortfolioReferenceNumber({
      createdAt,
      id: intake.id,
    });

    const details: PortfolioIntakeDetails = {
      ...payload,
      type: 'portfolio_intake',
      referenceNumber,
      createdAt: createdAt.toISOString(),
      status: 'new',
      confirmationEmailStatus: 'not_configured',
    };

    let confirmationEmailStatus: PortfolioIntakeDetails['confirmationEmailStatus'] = 'not_configured';
    try {
      confirmationEmailStatus = await sendConfirmationEmail(details);
    } catch (emailError) {
      console.error('Portfolio intake confirmation email failed:', emailError);
    }

    await prisma.auditLog.update({
      where: { id: intake.id },
      data: {
        details: JSON.stringify({
          ...details,
          confirmationEmailStatus,
        }),
      },
    });

    return NextResponse.json({
      ok: true,
      referenceNumber,
      message: 'Portfolio screening request received.',
    });
  } catch (error) {
    console.error('Portfolio intake error:', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to submit portfolio intake',
      },
      { status: 400 }
    );
  }
}
