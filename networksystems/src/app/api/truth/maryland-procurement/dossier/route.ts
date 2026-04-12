import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { runMarylandProcurementTruthCase } from '@/lib/risk/truth-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function writeWrapped(doc: jsPDF, text: string, x: number, y: number, width: number, lineHeight = 5): number {
  const lines = doc.splitTextToSize(text, width) as string[];
  lines.forEach((line, index) => doc.text(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

export async function GET() {
  try {
    const report = await runMarylandProcurementTruthCase();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    let y = 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TRUTH ARTIFACT: MARYLAND PROCUREMENT RISK', 14, y);
    y += 6;

    doc.setFontSize(16);
    doc.text('Gold-Standard Dossier', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 14, y);
    y += 5;
    doc.text(`Snapshot: ${report.snapshot.id}`, 14, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('1) Use Case', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    y = writeWrapped(doc, `User: ${report.useCase.user}`, 14, y, 182);
    y = writeWrapped(doc, `Job: ${report.useCase.job}`, 14, y + 1, 182);
    y = writeWrapped(doc, `Output: ${report.useCase.output}`, 14, y + 1, 182);
    y += 3;

    doc.setFont('helvetica', 'bold');
    doc.text('2) Measurable Gates', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Time to brief: ${report.wowGates.timeToBriefMinutes} min (<10 target)`, 14, y);
    y += 5;
    doc.text(
      `Precision (top flags): ${report.wowGates.precisionTopFlags === null ? 'N/A - no reviews' : `${Math.round(report.wowGates.precisionTopFlags * 100)}%`} (>=80 target)`,
      14,
      y
    );
    y += 5;
    doc.text(`Traceability coverage: ${Math.round(report.wowGates.traceabilityCoverage * 100)}%`, 14, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('3) Top High-Confidence Signals', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    for (const flag of report.topFlags.slice(0, 8)) {
      y = writeWrapped(
        doc,
        `• ${flag.agency} | ${flag.indicator} | ${currency(flag.exposure)} | conf ${Math.round(flag.confidence * 100)}%`,
        14,
        y,
        182
      );
      y += 1;
      doc.setTextColor(4, 120, 87);
      doc.textWithLink('Source', 18, y, { url: flag.sourceUrl });
      doc.setTextColor(0, 0, 0);
      y += 2;
      if (y > 250) {
        doc.addPage();
        y = 16;
      }
    }

    y += 3;
    if (y > 245) {
      doc.addPage();
      y = 16;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('4) Rejected False Positives', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    if (report.rejectedFalsePositives.length === 0) {
      doc.text('No analyst rejections recorded yet. First review cycle required.', 14, y);
      y += 5;
    } else {
      for (const item of report.rejectedFalsePositives) {
        y = writeWrapped(doc, `• ${item.ruleId}`, 14, y, 182);
        y = writeWrapped(doc, `Reason: ${item.reason}`, 18, y + 1, 176);
        y += 2;
        if (y > 250) {
          doc.addPage();
          y = 16;
        }
      }
    }

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Integrity: ${report.snapshot.stateHash}`, 14, 272);
    doc.text('STONEBRIDGE TRUTH ENGINE', 150, 272, { align: 'right' });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const stamp = report.generatedAt.slice(0, 19).replace(/[:T]/g, '-');
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=truth-dossier-maryland-${stamp}.pdf`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Truth dossier export failed:', error);
    return NextResponse.json({ error: 'Failed to export truth dossier' }, { status: 500 });
  }
}
