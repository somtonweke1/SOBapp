import { NextRequest, NextResponse } from 'next/server';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { getScannerInsights } from '@/lib/risk/scanner-insights';
import { evaluateEscalationReadiness } from '@/lib/risk/escalation-readiness';
import { validateClaimCorrespondence } from '@/lib/risk/claim-validation';
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
    const validations = validateClaimCorrespondence(flags, records);
    const validationByFlagId = new Map(validations.map((item) => [item.flagId, item]));
    const readiness = evaluateEscalationReadiness(flags, {
      scannerIsStale: insights.freshness.isStale,
      claimValidationByFlagId: validationByFlagId,
    });
    const byId = new Map(flags.map((flag) => [flag.id, flag]));

    const queue = readiness
      .map((item) => ({
        ...item,
        flag: byId.get(item.flagId) || null,
        validation: validationByFlagId.get(item.flagId) || null,
        externalReady: false,
      }))
      .filter((item) => item.flag)
      .sort((a, b) => b.priority - a.priority);

    const hardenedQueue = queue.map((item) => {
      const strictReady =
        item.ready &&
        !insights.freshness.isStale &&
        !!item.validation?.isCorresponding &&
        (item.flag?.challengeScore || 0) >= 85 &&
        (item.flag?.confidence || 0) >= 0.75;
      return { ...item, externalReady: strictReady };
    });

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      scannerFreshness: insights.freshness,
      totals: {
        flags: flags.length,
        readyToEscalate: hardenedQueue.filter((item) => item.ready).length,
        externalReady: hardenedQueue.filter((item) => item.externalReady).length,
        correspondencePassed: validations.filter((item) => item.isCorresponding).length,
      },
      queue: hardenedQueue,
    });
  } catch (error) {
    console.error('Escalation queue error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to build escalation queue' }, { status: 500 });
  }
}
