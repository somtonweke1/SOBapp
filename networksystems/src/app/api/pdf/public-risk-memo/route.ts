import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk, statuteLibrary, type RiskFlag } from '@/lib/risk/engine';
import { generateSnapshotId } from '@/lib/risk/integrity';
import { buildPreEscalationPlaybook } from '@/lib/risk/pre-escalation-playbook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function filterFlags(flags: RiskFlag[], searchParams: URLSearchParams): RiskFlag[] {
  const jurisdiction = searchParams.get('jurisdiction');
  const mode = searchParams.get('mode');
  const vendor = searchParams.get('vendor');
  return flags.filter((flag) => {
    const jurisdictionOk = !jurisdiction || flag.jurisdiction === jurisdiction;
    const modeOk = !mode || flag.basis === mode;
    const vendorOk = !vendor || flag.vendor === vendor;
    return jurisdictionOk && modeOk && vendorOk;
  });
}

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function writeWrapped(doc: jsPDF, text: string, x: number, y: number, width: number, lineHeight = 5): number {
  const lines = doc.splitTextToSize(text, width) as string[];
  lines.forEach((line, index) => {
    doc.text(line, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

export async function GET(request: NextRequest) {
  const generatedAt = request.nextUrl.searchParams.get('generatedAt') || new Date().toISOString();
  const accessKey = process.env.OPS_ACCESS_KEY;
  const providedKey = request.nextUrl.searchParams.get('key') || request.headers.get('x-ops-key');

  if (accessKey && providedKey !== accessKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const records = await ingestProcurementData();
    const flags = analyzePortfolioRisk(records);
    const filtered = filterFlags(flags, request.nextUrl.searchParams);
    const snapshotId = generateSnapshotId(filtered, generatedAt, {
      jurisdiction: request.nextUrl.searchParams.get('jurisdiction') || undefined,
      mode: request.nextUrl.searchParams.get('mode') || undefined,
      vendor: request.nextUrl.searchParams.get('vendor') || undefined,
    });

    const strictFindings = filtered.filter((f) => f.basis === 'STRICT_LAW');
    const heuristicFindings = filtered.filter((f) => f.basis === 'RISK_HEURISTIC');
    const totalExposure = filtered.reduce((sum, f) => sum + f.exposure, 0);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    let y = 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('CONFIDENTIAL: PROCUREMENT RISK BRIEFING', 14, y);
    y += 6;

    doc.setFontSize(18);
    doc.text('StoneBridge Public Risk Decision Memo', 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, 14, y);
    y += 5;
    doc.text(`Snapshot ID: ${snapshotId}`, 14, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('1) Executive Summary', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Exposure: ${currency(totalExposure)}`, 14, y);
    y += 5;
    doc.text(`Total Findings: ${filtered.length}`, 14, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('2) Statutory Findings (Strict Law)', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    if (strictFindings.length === 0) {
      doc.text('No strict-law findings for current filters.', 14, y);
      y += 6;
    } else {
      for (const finding of strictFindings.slice(0, 10)) {
        const citation = statuteLibrary[finding.citationKey];
        y = writeWrapped(
          doc,
          `• ${finding.agency}: ${finding.indicator} | Exposure ${currency(finding.exposure)} | ${finding.citation}`,
          14,
          y,
          182
        );
        y += 1;
        doc.setTextColor(4, 120, 87);
        doc.textWithLink('Source URL', 18, y, { url: finding.sourceUrl });
        doc.textWithLink('Statute', 44, y, { url: citation.url });
        doc.setTextColor(0, 0, 0);
        y += 2;
        if (y > 250) {
          doc.addPage();
          y = 16;
        }
      }
    }

    y += 4;
    if (y > 250) {
      doc.addPage();
      y = 16;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('3) Behavioral Findings (Risk Heuristics)', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    if (heuristicFindings.length === 0) {
      doc.text('No heuristic findings for current filters.', 14, y);
      y += 6;
    } else {
      for (const finding of heuristicFindings.slice(0, 10)) {
        const citation = statuteLibrary[finding.citationKey];
        y = writeWrapped(
          doc,
          `• ${finding.agency}: ${finding.indicator} | Confidence ${Math.round(finding.confidence * 100)}% | ${finding.citation}`,
          14,
          y,
          182
        );
        y += 1;
        doc.setTextColor(4, 120, 87);
        doc.textWithLink('Source URL', 18, y, { url: finding.sourceUrl });
        doc.textWithLink('Statute', 44, y, { url: citation.url });
        doc.setTextColor(0, 0, 0);
        y += 2;
        if (y > 250) {
          doc.addPage();
          y = 16;
        }
      }
    }

    y += 4;
    if (y > 250) {
      doc.addPage();
      y = 16;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('4) Pre-Escalation Solutions', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    for (const item of buildPreEscalationPlaybook(filtered)) {
      y = writeWrapped(doc, `• Question: ${item.question}`, 14, y, 182);
      y = writeWrapped(doc, `  Solution: ${item.solution}`, 14, y + 1, 182);
      y = writeWrapped(doc, `  Required evidence: ${item.requiredEvidence}`, 14, y + 1, 182);
      y = writeWrapped(doc, `  Owner: ${item.owner}`, 14, y + 1, 182);
      y += 2;
      if (y > 250) {
        doc.addPage();
        y = 16;
      }
    }

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Integrity Seal: ${snapshotId}`, 14, 272);
    doc.text('STONEBRIDGE • PUBLIC RISK MONITOR', 150, 272, { align: 'right' });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const stamp = generatedAt.slice(0, 19).replace(/[:T]/g, '-');
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=public-risk-memo-${stamp}.pdf`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Public risk memo PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
