import { NextRequest, NextResponse } from 'next/server';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk, type RiskFlag } from '@/lib/risk/engine';

export const dynamic = 'force-dynamic';

type Cadence = 'weekly' | 'monthly' | 'quarterly';

function pickCadence(input: string | null): Cadence {
  if (input === 'monthly' || input === 'quarterly') return input;
  return 'weekly';
}

function buildActionItems(flags: RiskFlag[]): string[] {
  const items: string[] = [];
  if (flags.some((flag) => flag.citationKey === 'COMAR_21_05_06_02A')) {
    items.push('Request extension approvals and emergency necessity memo for all contracts over 365 days.');
  }
  if (flags.some((flag) => flag.citationKey === 'COMAR_21_05_07_05A')) {
    items.push('Run vendor-level rollup for all small procurements in prior 12 months to test contract splitting.');
  }
  if (flags.some((flag) => flag.citationKey === 'COMAR_21_05_05')) {
    items.push('Require market availability memo before renewing sole-source terms in general supply categories.');
  }
  if (items.length === 0) items.push('No high-priority action items found for current filter set.');
  return items;
}

export async function GET(request: NextRequest) {
  try {
    const cadence = pickCadence(request.nextUrl.searchParams.get('cadence'));
    const agenciesFilter = request.nextUrl.searchParams.get('agencies');
    const agencies = agenciesFilter ? agenciesFilter.split(',').map((value) => value.trim()) : [];

    const records = await ingestProcurementData();
    const flags = analyzePortfolioRisk(records);

    const scoped = agencies.length > 0 ? flags.filter((flag) => agencies.includes(flag.agency)) : flags;
    const exposure = scoped.reduce((sum, flag) => sum + flag.exposure, 0);

    const topFindings = [...scoped]
      .sort((a, b) => b.exposure - a.exposure)
      .slice(0, 10)
      .map((flag) => ({
        id: flag.id,
        agency: flag.agency,
        vendor: flag.vendor,
        indicator: flag.indicator,
        citation: flag.citation,
        basis: flag.basis,
        challengeScore: flag.challengeScore,
        exposure: flag.exposure,
      }));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      cadence,
      scope: agencies.length > 0 ? agencies : 'ALL_AGENCIES',
      metrics: {
        totalExposure: exposure,
        findings: scoped.length,
        strictLawFindings: scoped.filter((flag) => flag.basis === 'STRICT_LAW').length,
        defensibleFindings: scoped.filter((flag) => (flag.challengeScore || 0) >= 85).length,
      },
      topFindings,
      actionItems: buildActionItems(scoped),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate retained briefing' },
      { status: 500 }
    );
  }
}
