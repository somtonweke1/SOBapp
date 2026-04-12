import { NextRequest, NextResponse } from 'next/server';
import { DealDecision, DealSubmittedBy, PilotStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { normalizeDealAddress, extractZipCode, neighborhoodFromZip } from '@/lib/deal-records';
import {
  buildPilotReferenceNumber,
  pilotSubmissionSchema,
  type PilotSubmissionDetails,
} from '@/lib/pilot';

export const runtime = 'nodejs';

async function sendPilotConfirmationEmail(details: PilotSubmissionDetails) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log('Pilot confirmation email skipped: RESEND_API_KEY not set', details);
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
      to: [details.submitter_email],
      subject: `StoneBridge pilot submission received (${details.referenceNumber})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #18181b;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">StoneBridge pilot submission received</h1>
          <p style="line-height: 1.6;">We received your Baltimore property for pilot risk screening.</p>
          <div style="margin: 24px 0; padding: 20px; border: 1px solid #e4e4e7; border-radius: 16px; background: #fafafa;">
            <p style="margin: 0 0 8px;"><strong>Reference:</strong> ${details.referenceNumber}</p>
            <p style="margin: 0 0 8px;"><strong>Institution:</strong> ${details.institution_name}</p>
            <p style="margin: 0 0 8px;"><strong>Property:</strong> ${details.property_address}</p>
            <p style="margin: 0;"><strong>Expected delivery:</strong> ${details.expectedDelivery}</p>
          </div>
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
    const payload = pilotSubmissionSchema.parse(rawPayload);

    let institutionName = payload.institution_name;
    const tokenValue = payload.token?.trim();
    if (tokenValue) {
      const token = await prisma.pilotAccessToken.findUnique({
        where: { token: tokenValue },
      });

      if (token) {
        institutionName = token.institution_name;
      }
    }

    const createdAt = new Date();
    const pilot = await prisma.pilotEngagement.upsert({
      where: {
        institution_name: institutionName,
      },
      update: {
        contact_name: payload.submitter_name,
        contact_email: payload.submitter_email.toLowerCase(),
        deals_submitted: {
          increment: 1,
        },
      },
      create: {
        institution_name: institutionName,
        contact_name: payload.submitter_name,
        contact_email: payload.submitter_email.toLowerCase(),
        pilot_start_date: createdAt,
        pilot_status: PilotStatus.ACTIVE,
        deal_target: 10,
        deals_submitted: 1,
      },
    });

    const normalizedAddress = normalizeDealAddress(payload.property_address);
    const zipCode = extractZipCode(payload.property_address);
    const dealRecord = await prisma.dealRecord.create({
      data: {
        address: normalizedAddress,
        zip_code: zipCode,
        neighborhood: neighborhoodFromZip(zipCode),
        decision: DealDecision.INSUFFICIENT,
        decision_drivers: ['Pilot submission received; full scan not yet run'],
        submitted_by: DealSubmittedBy.INSTITUTIONAL,
        institution_name: institutionName,
        scan_timestamp: createdAt,
        notes: `Pilot submission: ${payload.deal_type} / ${payload.timeline}`,
      },
    });

    const audit = await prisma.auditLog.create({
      data: {
        action: 'pilot_submission_created',
        resource: 'pilot_submission',
        resourceId: dealRecord.id,
        timestamp: createdAt,
        details: JSON.stringify({
          ...payload,
          institution_name: institutionName,
          createdAt: createdAt.toISOString(),
          type: 'pilot_submission',
          status: 'new',
          expectedDelivery: 'within 24 hours',
          pilotEngagementId: pilot.id,
          dealRecordId: dealRecord.id,
        }),
      },
    });

    const referenceNumber = buildPilotReferenceNumber({ createdAt, id: audit.id });
    const details: PilotSubmissionDetails = {
      ...payload,
      institution_name: institutionName,
      type: 'pilot_submission',
      referenceNumber,
      createdAt: createdAt.toISOString(),
      status: 'new',
      expectedDelivery: 'within 24 hours',
      confirmationEmailStatus: 'not_configured',
      pilotEngagementId: pilot.id,
      dealRecordId: dealRecord.id,
    };

    let confirmationEmailStatus: PilotSubmissionDetails['confirmationEmailStatus'] = 'not_configured';
    try {
      confirmationEmailStatus = await sendPilotConfirmationEmail(details);
    } catch (error) {
      console.error('Pilot confirmation email failed:', error);
    }

    await prisma.auditLog.update({
      where: { id: audit.id },
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
      expectedDelivery: 'within 24 hours',
    });
  } catch (error) {
    console.error('Pilot submission error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to submit pilot deal' }, { status: 400 });
  }
}
