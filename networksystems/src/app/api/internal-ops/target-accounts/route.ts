import { NextRequest, NextResponse } from 'next/server';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { buildTargetAccountFeed } from '@/lib/risk/target-account-feed';
import { getScannerInsights } from '@/lib/risk/scanner-insights';
import { prisma } from '@/lib/prisma';
import { buildContactCandidatesByCompany, normalizeCompanyKey } from '@/lib/risk/contact-candidates';
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
    const targets = buildTargetAccountFeed(records, flags).slice(0, 50);
    let seeds: Array<{ entityName: string; evidencePoints: string[] }> = [];
    try {
      const ownershipRows = await (prisma as any).discoveredOwnership.findMany({
        select: { entityName: true, evidencePoints: true },
        take: 500,
      });
      seeds = ownershipRows.map((row: any) => {
        let evidencePoints: string[] = [];
        try {
          evidencePoints = JSON.parse(row.evidencePoints || '[]');
        } catch {
          evidencePoints = [];
        }
        return { entityName: row.entityName, evidencePoints };
      });
    } catch {
      seeds = [];
    }
    const byCompany = buildContactCandidatesByCompany(seeds);
    const hydrated = targets.map((target) => {
      const names = byCompany.get(normalizeCompanyKey(target.company)) || [];
      return {
        ...target,
        contactDiscovery: {
          ...target.contactDiscovery,
          candidatePeople: names.map((name) => ({
            name,
            titleGuess: 'Chief Estimator (verify)',
            source: 'Discovered ownership evidence',
          })),
        },
      };
    });
    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      scannerFreshness: insights.freshness,
      totals: {
        records: records.length,
        flags: flags.length,
        targets: hydrated.length,
      },
      targets: hydrated,
    });
  } catch (error) {
    console.error('Target account feed error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to build target account feed' }, { status: 500 });
  }
}
