import { NextRequest, NextResponse } from 'next/server';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { runAutoScannerIfStale } from '@/lib/risk/auto-scanner';
import { getScannerInsights } from '@/lib/risk/scanner-insights';
import { buildEmergencyValidation } from '@/lib/risk/emergency-validator';

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
    const results = buildEmergencyValidation(records).sort((a, b) => b.amount - a.amount);
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      scannerFreshness: insights.freshness,
      totals: {
        emergencyRecords: results.length,
        red: results.filter((r) => r.status === 'RED').length,
        amber: results.filter((r) => r.status === 'AMBER').length,
        green: results.filter((r) => r.status === 'GREEN').length,
      },
      results,
    });
  } catch (error) {
    console.error('Emergency validator error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to generate emergency validation results' }, { status: 500 });
  }
}
