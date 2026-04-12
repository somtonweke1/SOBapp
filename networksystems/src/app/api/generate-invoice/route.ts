import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

export const runtime = 'nodejs';

type Payload = {
  ownerName?: string;
  propertyAddress?: string;
  dpwAccountNumber?: string;
  grossDisputedAmount?: number;
  recoveredAmount?: number;
  evidenceUrl?: string;
};

const money = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export async function POST(request: Request) {
  let payload: Payload = {};
  try {
    payload = (await request.json()) as Payload;
  } catch {
    // ignore
  }

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const left = 54;
  let y = 72;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('StoneBridge AI - Recovery Invoice', left, y);

  y += 24;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, left, y);

  y += 18;
  doc.setFontSize(11);
  doc.text(`Owner: ${payload.ownerName || '-'}`, left, y);
  y += 16;
  doc.text(`Property: ${payload.propertyAddress || '-'}`, left, y);
  y += 16;
  doc.text(`DPW Account: ${payload.dpwAccountNumber || '-'}`, left, y);

  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.text('Amounts', left, y);
  doc.setFont('helvetica', 'normal');
  y += 16;

  const gross = Number(payload.grossDisputedAmount);
  const recovered = Number(payload.recoveredAmount);
  doc.text(`Gross Disputed: ${Number.isFinite(gross) ? money(gross) : '-'}`, left, y);
  y += 16;
  doc.text(`Recovered: ${Number.isFinite(recovered) ? money(recovered) : '-'}`, left, y);

  if (payload.evidenceUrl) {
    y += 24;
    doc.setFont('helvetica', 'bold');
    doc.text('Evidence', left, y);
    doc.setFont('helvetica', 'normal');
    y += 16;
    doc.setTextColor(20, 110, 190);
    doc.textWithLink(payload.evidenceUrl, left, y, { url: payload.evidenceUrl });
    doc.setTextColor(0, 0, 0);
  }

  const buffer = doc.output('arraybuffer');
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="stonebridge-recovery-invoice.pdf"',
      'Cache-Control': 'no-store',
    },
  });
}

