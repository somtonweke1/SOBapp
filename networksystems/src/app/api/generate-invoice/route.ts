import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

type InvoiceRequest = {
  ownerName: string;
  propertyAddress: string;
  dpwAccountNumber: string;
  grossDisputedAmount: number;
  recoveredAmount: number;
  evidenceUrl?: string;
};

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const generateCaseId = () => {
  const year = new Date().getFullYear();
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `SOB-${year}-${suffix}`;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<InvoiceRequest>;
    const ownerName = body.ownerName || 'Unknown Owner';
    const propertyAddress = body.propertyAddress || 'Unknown Address';
    const dpwAccountNumber = body.dpwAccountNumber || 'Unknown Account';
    const grossDisputedAmount = Number(body.grossDisputedAmount || 0);
    const recoveredAmount = Number(body.recoveredAmount || 0);
    const successFee = recoveredAmount * 0.3;
    const netCapitalGained = recoveredAmount - successFee;
    const evidenceUrl = body.evidenceUrl || 'https://sobapp.vercel.app/dashboard';

    const caseId = generateCaseId();
    const issueDate = new Date().toLocaleDateString('en-US');
    const agreementTimestamp = new Date().toISOString();

    const qrDataUrl = await QRCode.toDataURL(evidenceUrl, { margin: 1, width: 160 });
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'invoice-template.html');
    const template = await fs.readFile(templatePath, 'utf-8');

    const html = template
      .replace('{{caseId}}', caseId)
      .replace('{{issueDate}}', issueDate)
      .replace('{{ownerName}}', ownerName)
      .replace('{{propertyAddress}}', propertyAddress)
      .replace('{{dpwAccountNumber}}', dpwAccountNumber)
      .replace('{{evidenceReference}}', evidenceUrl)
      .replace('{{grossDisputedAmount}}', formatCurrency(grossDisputedAmount))
      .replace('{{recoveredAmount}}', formatCurrency(recoveredAmount))
      .replace('{{successFee}}', formatCurrency(successFee))
      .replace('{{netCapitalGained}}', formatCurrency(netCapitalGained))
      .replace('{{agreementTimestamp}}', agreementTimestamp)
      .replace('{{qrCode}}', qrDataUrl);

    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    await doc.html(html, { x: 0, y: 0, width: 612 });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=recovery-invoice-${caseId}.pdf`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
