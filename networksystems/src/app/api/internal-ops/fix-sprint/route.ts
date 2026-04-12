import { NextRequest, NextResponse } from 'next/server';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { buildFixSprintPlan } from '@/lib/risk/fix-sprint';
import { getScannerInsights } from '@/lib/risk/scanner-insights';
import { runAutoScannerIfStale } from '@/lib/risk/auto-scanner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(request: NextRequest): boolean {
  const secrets = [
    process.env.SCANNER_CRON_SECRET,
    process.env.CRON_SECRET,
    process.env.OPS_ACCESS_KEY,
    process.env.STONEBRIDGE_ACCESS_CODE,
  ].filter((value): value is string => !!value && value.trim().length > 0);

  if (secrets.length === 0) return true;

  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const querySecret = request.nextUrl.searchParams.get('secret') || '';
  return secrets.includes(bearer) || secrets.includes(querySecret);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runAutoScannerIfStale(24 * 60);
    const [records, insights] = await Promise.all([ingestProcurementData(), getScannerInsights(7)]);
    const flags = analyzePortfolioRisk(records);
    const plan = buildFixSprintPlan(records, flags);

    return NextResponse.json({
      ok: true,
      scannerFreshness: insights.freshness,
      totals: {
        records: records.length,
        flags: flags.length,
        remediationCases: plan.remediationQueue.length,
      },
      plan,
    });
  } catch (error) {
    console.error('Fix sprint plan error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to generate fix sprint plan' }, { status: 500 });
  }
}
