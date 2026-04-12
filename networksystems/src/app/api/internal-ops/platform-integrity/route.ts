import { NextRequest, NextResponse } from 'next/server';
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
    const insights = await getScannerInsights(7);
    const allowSimulation = String(process.env.ALLOW_SIMULATION_APIS || '').toLowerCase() === 'true';
    const assetConnectorConfigured = !!process.env.ASSET_MONITORING_CONNECTOR_URL;

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      checks: {
        scannerFresh: !insights.freshness.isStale,
        scannerHoursSinceLastRun: insights.freshness.hoursSinceLastRun,
        simulationEndpointsBlocked: !allowSimulation,
        assetConnectorConfigured,
      },
      notes: [
        'External escalation should only use records with correspondence PASS and scannerFresh=true.',
        'Simulation endpoints are blocked unless ALLOW_SIMULATION_APIS=true.',
      ],
    });
  } catch (error) {
    console.error('Platform integrity check error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to compute platform integrity status' }, { status: 500 });
  }
}
