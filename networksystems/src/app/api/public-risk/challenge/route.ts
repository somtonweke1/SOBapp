import { NextRequest, NextResponse } from 'next/server';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { runChallengeEngineForPortfolio } from '@/lib/risk/challenge-engine';
import { resolveProcurementVendors } from '@/lib/risk/vendor-resolution';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const flagId = request.nextUrl.searchParams.get('flagId');
    const records = await ingestProcurementData();
    const { records: resolvedRecords } = resolveProcurementVendors(records);
    const flags = analyzePortfolioRisk(records);

    const results = runChallengeEngineForPortfolio(flags, resolvedRecords);
    const filtered = flagId ? results.filter((result) => result.flagId === flagId) : results;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: filtered.length,
      results: filtered,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run challenge engine' },
      { status: 500 }
    );
  }
}
