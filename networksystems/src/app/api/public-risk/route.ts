import { NextResponse } from 'next/server';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { buildEvidenceGraph } from '@/lib/risk/evidence-graph';
import { resolveProcurementVendors } from '@/lib/risk/vendor-resolution';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const records = await ingestProcurementData();
    const { records: resolvedRecords, entities } = resolveProcurementVendors(records);
    const flags = analyzePortfolioRisk(records);
    const graph = buildEvidenceGraph(resolvedRecords, flags);

    const defensibleCount = flags.filter((flag) => (flag.challengeScore || 0) >= 85).length;
    const avgChallengeScore =
      flags.length === 0
        ? 0
        : Math.round(flags.reduce((sum, flag) => sum + (flag.challengeScore || 0), 0) / flags.length);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      recordsCount: records.length,
      flagsCount: flags.length,
      vendorEntitiesCount: entities.length,
      defensibility: {
        defensibleCount,
        averageChallengeScore: avgChallengeScore,
      },
      evidenceGraphSummary: graph.summary,
      flags,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to build procurement risk view',
      },
      { status: 500 }
    );
  }
}
