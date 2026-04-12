import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import TargetCompanySolutionStudio from './components/TargetCompanySolutionStudio';
import type { RiskFlag } from '@/lib/risk/engine';
import { buildTargetAccountFeed } from '@/lib/risk/target-account-feed';
import { getScannerInsights } from '@/lib/risk/scanner-insights';
import { runAutoScannerIfStale } from '@/lib/risk/auto-scanner';
import { prisma } from '@/lib/prisma';
import { buildContactCandidatesByCompany, normalizeCompanyKey } from '@/lib/risk/contact-candidates';

export const dynamic = 'force-dynamic';

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function inferProfile(flags: RiskFlag[]): 'Emerging Multifamily' | 'Distressed Redevelopment' | 'Public-Interface Heavy' {
  const indicatorText = flags.map((f) => `${f.indicator} ${f.citation}`.toLowerCase()).join(' ');
  const strictCount = flags.filter((f) => f.basis === 'STRICT_LAW').length;
  if (indicatorText.includes('mbe') || indicatorText.includes('dbe') || indicatorText.includes('pass-through')) {
    return 'Public-Interface Heavy';
  }
  if (indicatorText.includes('emergency') || indicatorText.includes('liability') || indicatorText.includes('splitting')) {
    return 'Distressed Redevelopment';
  }
  if (strictCount >= Math.ceil(flags.length / 2)) return 'Public-Interface Heavy';
  return 'Emerging Multifamily';
}

function focusForProfile(profile: 'Emerging Multifamily' | 'Distressed Redevelopment' | 'Public-Interface Heavy'): string {
  if (profile === 'Distressed Redevelopment') {
    return 'Hidden-operating-risk diagnosis for distressed acquisitions and rehab sequencing';
  }
  if (profile === 'Public-Interface Heavy') {
    return 'Public-record signal fusion for deals exposed to utility, permitting, or city-process friction';
  }
  return 'Fast pre-acquisition clarity for sponsors underwriting smaller Baltimore deals';
}

export default async function InternalHooksPage() {
  await runAutoScannerIfStale(24 * 60);
  const [records, insights] = await Promise.all([ingestProcurementData(), getScannerInsights(7)]);
  const allFlags = analyzePortfolioRisk(records).sort((a, b) => (b.challengeScore || 0) - (a.challengeScore || 0));
  const flags = allFlags.slice(0, 5);
  const baseTargetFeed = buildTargetAccountFeed(records, allFlags).slice(0, 12);
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
  const targetFeed = baseTargetFeed.map((target) => {
    const names = byCompany.get(normalizeCompanyKey(target.company)) || [];
    return {
      ...target,
      contactDiscovery: {
        ...target.contactDiscovery,
        candidatePeople: names.map((name) => ({
          name,
          titleGuess: 'Developer Principal (verify)',
          source: 'Discovered ownership evidence',
        })),
      },
    };
  });

  const vendorMap = new Map<string, RiskFlag[]>();
  for (const flag of allFlags) {
    const key = flag.vendor?.trim();
    if (!key) continue;
    const current = vendorMap.get(key) || [];
    current.push(flag);
    vendorMap.set(key, current);
  }

  const targets = [...vendorMap.entries()]
    .map(([vendor, vendorFlags]) => {
      const profile = inferProfile(vendorFlags);
      const jurisdiction = vendorFlags[0]?.jurisdiction || 'Unknown jurisdiction';
      const riskFocus = Array.from(new Set(vendorFlags.map((f) => f.indicator))).slice(0, 3);
      const exposure = vendorFlags.reduce((sum, f) => sum + f.exposure, 0);
      return {
        id: slugify(vendor),
        name: vendor,
        hq: jurisdiction,
        profile,
        operationalFocus: focusForProfile(profile),
        riskFocus,
        exposure,
      };
    })
    .sort((a, b) => b.exposure - a.exposure)
    .slice(0, 10)
    .map(({ exposure, ...rest }) => rest);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-10">
      <div className="mx-auto max-w-6xl rounded-2xl border border-zinc-200/50 bg-white/90 p-8 shadow-sm backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Internal Ops</p>
        <h1 className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">Baltimore Deal Diagnostic GTM</h1>
        <p className="mt-2 text-sm font-light text-zinc-600">
          Live outreach and delivery targets generated from current public-data signals rather than a static account list.
        </p>
        <p className="mt-2 text-sm font-light text-zinc-600">
          Position Maryland contractors and vendors by recent public procurement activity, not by overstating that all
          live bidders are public. Use SAM.gov, eMMA, DGS, and county bid tabs to establish why now, then route to the
          owner, president, government contracts lead, or operations lead with one message only.
        </p>
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          You may be about to sign a material construction or vendor agreement without a current vendor-risk picture.
          We will deliver that in 24 hours for $199, or you pay nothing.
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Scanner freshness: {insights.freshness.isStale ? 'stale' : 'fresh'} · latest finding {insights.freshness.latestFindingAt
            ? new Date(insights.freshness.latestFindingAt).toLocaleString()
            : 'n/a'}
        </p>

        <div className="mt-6 space-y-3">
          {flags.map((flag) => {
            return (
              <div key={flag.id} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4">
                <div>
                  <p className="text-sm font-light text-zinc-900">{flag.indicator}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {flag.agency} • {flag.vendor} • {currency(flag.exposure)} • {(flag.challengeScore || 0)}% defensible
                  </p>
                </div>
                <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-light text-zinc-700">Live Signal</span>
              </div>
            );
          })}
        </div>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-extralight tracking-tight text-zinc-900">Live Target Accounts (Deal-Diagnostic Wedge)</h2>
            <span className="text-xs text-zinc-500">{targetFeed.length} targets</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Why Now</th>
                  <th className="px-4 py-3">Exposure</th>
                  <th className="px-4 py-3">Contact Role</th>
                  <th className="px-4 py-3">Diagnostic Memo</th>
                  <th className="px-4 py-3">2-Week Clarity Sprint</th>
                  <th className="px-4 py-3">Contact Discovery</th>
                </tr>
              </thead>
              <tbody>
                {targetFeed.map((target) => (
                  <tr key={target.id} className="border-t border-zinc-200/70">
                    <td className="px-4 py-3 font-medium text-zinc-900">{target.company}</td>
                    <td className="px-4 py-3 font-light text-zinc-700">{target.whyNow}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{currency(target.totalExposure)}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {target.recommendedPrimaryContact}
                      <span className="text-zinc-500"> / {target.recommendedSecondaryContact}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      <p className="font-medium text-zinc-900">{target.rapidRiskBrief.name}</p>
                      <p className="text-xs text-zinc-600">
                        ${target.rapidRiskBrief.priceUsd} · {target.rapidRiskBrief.deliveryHours}h
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">{target.rapidRiskBrief.objective}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      <p className="font-medium text-zinc-900">{target.procurementFixSprint.name}</p>
                      <p className="text-xs text-zinc-600">
                        {target.procurementFixSprint.feeUsdRange} · {target.procurementFixSprint.durationDays} days
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">{target.procurementFixSprint.focus}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {target.contactDiscovery.candidatePeople.length > 0 ? (
                        <div className="space-y-1">
                          {target.contactDiscovery.candidatePeople.slice(0, 2).map((person) => (
                            <p key={`${target.id}-${person.name}`} className="text-xs text-zinc-700">
                              {person.name} · {person.titleGuess}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500">No named contacts yet</p>
                      )}
                      <p className="mt-1 text-xs text-zinc-500">{target.contactDiscovery.queries[0]}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <TargetCompanySolutionStudio targets={targets} liveSignals={allFlags} />
      </div>
    </main>
  );
}
