import { NextResponse } from 'next/server';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { buildEvidenceGraph } from '@/lib/risk/evidence-graph';
import { resolveProcurementVendors } from '@/lib/risk/vendor-resolution';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const records = await ingestProcurementData();
    const { records: resolvedRecords } = resolveProcurementVendors(records);
    const flags = analyzePortfolioRisk(records);
    const graph = buildEvidenceGraph(resolvedRecords, flags);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      ...graph,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build evidence graph' },
      { status: 500 }
    );
  }
}
