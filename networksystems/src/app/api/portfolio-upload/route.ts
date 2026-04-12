import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildPortfolioUploadReferenceNumber,
  contextToEnum,
  looksLikeAddress,
  normalizeUploadedAddress,
  parseAddressCsv,
  portfolioDealContextOptions,
  portfolioUploadSchema,
} from '@/lib/portfolio-upload';

export const runtime = 'nodejs';

async function sendConfirmationEmail(input: {
  institutionName: string;
  contactEmail: string;
  contactName: string;
  addressCount: number;
  dealContext: string;
  referenceNumber: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log('Portfolio upload confirmation email skipped: RESEND_API_KEY not set', input);
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
      to: [input.contactEmail],
      subject: `StoneBridge portfolio upload received (${input.referenceNumber})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #18181b;">
          <h1 style="font-size: 24px; margin-bottom: 16px;">Portfolio upload received</h1>
          <p style="line-height: 1.6;">StoneBridge received your Baltimore portfolio screening upload.</p>
          <div style="margin: 24px 0; padding: 20px; border: 1px solid #e4e4e7; border-radius: 16px; background: #fafafa;">
            <p style="margin: 0 0 8px;"><strong>Reference:</strong> ${input.referenceNumber}</p>
            <p style="margin: 0 0 8px;"><strong>Institution:</strong> ${input.institutionName}</p>
            <p style="margin: 0 0 8px;"><strong>Address count:</strong> ${input.addressCount}</p>
            <p style="margin: 0;"><strong>Deal context:</strong> ${input.dealContext}</p>
          </div>
          <p style="line-height: 1.6;">Expected delivery: within 24 hours.</p>
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
    const formData = await request.formData();
    const institutionName = String(formData.get('institutionName') || '');
    const contactName = String(formData.get('contactName') || '');
    const contactEmail = String(formData.get('contactEmail') || '');
    const dealContext = String(formData.get('dealContext') || '');
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: 'CSV file is required' }, { status: 400 });
    }

    if (!portfolioDealContextOptions.includes(dealContext as (typeof portfolioDealContextOptions)[number])) {
      return NextResponse.json({ ok: false, error: 'Invalid deal context' }, { status: 400 });
    }

    const rawCsv = await file.text();
    const parsedRows = parseAddressCsv(rawCsv);
    const invalidRows = parsedRows.filter((row) => !looksLikeAddress(row.address));

    if (invalidRows.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid address format in row${invalidRows.length === 1 ? '' : 's'} ${invalidRows.map((row) => row.rowNumber).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const addresses = parsedRows.map((row) => normalizeUploadedAddress(row.address));

    if (addresses.length > 200) {
      return NextResponse.json(
        {
          ok: false,
          error: 'For portfolios over 200 assets contact us directly for enterprise pricing',
        },
        { status: 400 }
      );
    }

    const payload = portfolioUploadSchema.parse({
      institutionName,
      contactName,
      contactEmail,
      dealContext,
      addresses,
    });

    const createdAt = new Date();
    const referenceNumber = buildPortfolioUploadReferenceNumber(createdAt);
    const upload = await prisma.portfolioUpload.create({
      data: {
        institution_name: payload.institutionName,
        contact_name: payload.contactName,
        contact_email: payload.contactEmail.toLowerCase(),
        addresses: payload.addresses,
        address_count: payload.addresses.length,
        deal_context: contextToEnum(payload.dealContext),
        status: 'RECEIVED',
        reference_number: referenceNumber,
        submitted_at: createdAt,
      },
    });

    let confirmationEmailStatus: 'sent' | 'not_configured' = 'not_configured';
    try {
      confirmationEmailStatus = await sendConfirmationEmail({
        institutionName: payload.institutionName,
        contactEmail: payload.contactEmail,
        contactName: payload.contactName,
        addressCount: payload.addresses.length,
        dealContext: payload.dealContext,
        referenceNumber,
      });
    } catch (error) {
      console.error('Portfolio upload confirmation email failed:', error);
    }

    await prisma.auditLog.create({
      data: {
        action: 'portfolio_upload_created',
        resource: 'portfolio_upload',
        resourceId: upload.id,
        timestamp: createdAt,
        details: JSON.stringify({
          referenceNumber,
          institutionName: payload.institutionName,
          contactName: payload.contactName,
          contactEmail: payload.contactEmail.toLowerCase(),
          addressCount: payload.addresses.length,
          dealContext: payload.dealContext,
          confirmationEmailStatus,
        }),
      },
    });

    return NextResponse.json({
      ok: true,
      referenceNumber,
      addressCount: payload.addresses.length,
      expectedDelivery: 'within 24 hours',
    });
  } catch (error) {
    console.error('Portfolio upload error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to upload portfolio' }, { status: 400 });
  }
}
