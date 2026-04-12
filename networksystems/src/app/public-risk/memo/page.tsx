import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk, statuteLibrary, type RiskFlag } from '@/lib/risk/engine';
import { generateSnapshotId } from '@/lib/risk/integrity';

export const dynamic = 'force-dynamic';

type MemoSearchParams = {
  jurisdiction?: 'Maryland State' | 'Baltimore City';
  mode?: 'STRICT_LAW' | 'RISK_HEURISTIC';
  vendor?: string;
  generatedAt?: string;
  snapshotId?: string;
  view?: 'screen' | 'print';
};

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function filterFlags(flags: RiskFlag[], searchParams: MemoSearchParams): RiskFlag[] {
  return flags.filter((flag) => {
    const jurisdictionOk = !searchParams.jurisdiction || flag.jurisdiction === searchParams.jurisdiction;
    const modeOk = !searchParams.mode || flag.basis === searchParams.mode;
    const vendorOk = !searchParams.vendor || flag.vendor === searchParams.vendor;
    return jurisdictionOk && modeOk && vendorOk;
  });
}

function getPrimaryJurisdiction(flags: RiskFlag[]): string {
  if (flags.length === 0) return 'N/A';
  const totals = new Map<string, number>();
  for (const flag of flags) {
    totals.set(flag.jurisdiction, (totals.get(flag.jurisdiction) || 0) + flag.exposure);
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function buildActionItems(strictFindings: RiskFlag[], heuristicFindings: RiskFlag[]): string[] {
  const items: string[] = [];

  if (strictFindings.some((f) => f.citationKey === 'COMAR_21_05_06_02A')) {
    items.push('Request BPW agenda follow-up on emergency contracts exceeding 365 days and ask for extension approval records.');
  }
  if (heuristicFindings.some((f) => f.citationKey === 'COMAR_21_05_05')) {
    items.push('Require agency-side market research memo for sole-source awards involving common supply categories.');
  }
  if (heuristicFindings.some((f) => f.citationKey === 'COMAR_21_05_07_05A')) {
    items.push('Ask procurement office for vendor-level small procurement rollups to test potential artificial division patterns.');
  }
  if (heuristicFindings.some((f) => f.citationKey === 'BALT_CHARTER_ART_VI_11')) {
    items.push('For upcoming BOE reviews, ask agencies to document emergency necessity and why competitive timing was not feasible.');
  }

  if (items.length === 0) {
    items.push('No high-priority action items generated for current filters. Expand scope or include heuristics to surface leads.');
  }

  return items;
}

export default async function PublicRiskMemoPage({
  searchParams,
}: {
  searchParams?: MemoSearchParams;
}) {
  const generatedAt = searchParams?.generatedAt || new Date().toISOString();
  const view = searchParams?.view || 'screen';
  const isPrint = view === 'print';
  const records = await ingestProcurementData();
  const flags = analyzePortfolioRisk(records);
  const filtered = filterFlags(flags, searchParams || {});
  const snapshotId =
    searchParams?.snapshotId ||
    generateSnapshotId(filtered, generatedAt, {
      jurisdiction: searchParams?.jurisdiction,
      mode: searchParams?.mode,
      vendor: searchParams?.vendor,
    });

  const strictFindings = filtered
    .filter((f) => f.basis === 'STRICT_LAW')
    .sort((a, b) => b.confidence - a.confidence);
  const heuristicFindings = filtered
    .filter((f) => f.basis === 'RISK_HEURISTIC')
    .sort((a, b) => b.confidence - a.confidence);

  const totalExposure = filtered.reduce((sum, f) => sum + f.exposure, 0);
  const primaryJurisdiction = getPrimaryJurisdiction(filtered);
  const actionItems = buildActionItems(strictFindings, heuristicFindings);

  return (
    <main className={`min-h-screen p-8 ${isPrint ? 'bg-white text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      <div className="mx-auto max-w-5xl space-y-8">
        <header className={`border-b pb-4 ${isPrint ? 'border-slate-300' : 'border-slate-800'}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${isPrint ? 'text-slate-500' : 'text-slate-400'}`}>
            Confidential: Procurement Risk Briefing
          </p>
          <h1 className={`mt-2 text-3xl font-semibold ${isPrint ? 'text-slate-900' : 'text-white'}`}>Decision Memo</h1>
          <p className={`mt-1 text-sm ${isPrint ? 'text-slate-600' : 'text-slate-300'}`}>Generated {new Date(generatedAt).toLocaleString()}</p>
          <p className={`mt-1 font-mono text-xs font-semibold tracking-wide ${isPrint ? 'text-slate-500' : 'text-slate-400'}`}>Snapshot ID: {snapshotId}</p>
        </header>

        <section>
          <h2 className="text-xl font-semibold">1. Executive Summary</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className={`rounded-sm border p-3 ${isPrint ? 'border-slate-300' : 'border-slate-800 bg-slate-900'}`}>
              <div className="text-xs uppercase tracking-wide text-slate-500">Total Exposure</div>
              <div className={`font-mono text-lg font-semibold ${isPrint ? 'text-slate-900' : 'text-white'}`}>{currency(totalExposure)}</div>
            </div>
            <div className={`rounded-sm border p-3 ${isPrint ? 'border-slate-300' : 'border-slate-800 bg-slate-900'}`}>
              <div className="text-xs uppercase tracking-wide text-slate-500">Primary Jurisdiction</div>
              <div className={`text-lg font-semibold ${isPrint ? 'text-slate-900' : 'text-white'}`}>{primaryJurisdiction}</div>
            </div>
            <div className={`rounded-sm border p-3 ${isPrint ? 'border-slate-300' : 'border-slate-800 bg-slate-900'}`}>
              <div className="text-xs uppercase tracking-wide text-slate-500">Findings</div>
              <div className={`font-mono text-lg font-semibold ${isPrint ? 'text-slate-900' : 'text-white'}`}>{filtered.length}</div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">2. Statutory Findings (Strict Law)</h2>
          <div className={`mt-3 overflow-x-auto rounded-sm border ${isPrint ? 'border-slate-300' : 'border-slate-800 bg-slate-900'}`}>
            <table className="min-w-full text-sm">
              <thead className={`${isPrint ? 'bg-slate-50' : 'bg-slate-950'} text-left text-xs uppercase tracking-wide text-slate-500`}>
                <tr>
                  <th className="px-3 py-2">Indicator</th>
                  <th className="px-3 py-2">Agency</th>
                  <th className="px-3 py-2">Exposure</th>
                  <th className="px-3 py-2">Challenge</th>
                  <th className="px-3 py-2">Citation</th>
                </tr>
              </thead>
              <tbody>
                {strictFindings.map((item) => (
                  <tr key={item.id} className={`border-t ${isPrint ? 'border-slate-200' : 'border-slate-800'}`}>
                    <td className="px-3 py-3">{item.indicator}</td>
                    <td className="px-3 py-3">{item.agency}</td>
                    <td className="px-3 py-3 font-mono">{currency(item.exposure)}</td>
                    <td className="px-3 py-3 font-mono">{item.challengeScore ?? 0}%</td>
                    <td className="px-3 py-3">
                      <a className={`font-mono ${isPrint ? 'text-emerald-700' : 'text-emerald-400'} underline`} href={statuteLibrary[item.citationKey].url} target="_blank" rel="noreferrer">
                        {item.citation}
                      </a>
                    </td>
                  </tr>
                ))}
                {strictFindings.length === 0 && (
                  <tr>
                    <td className={`px-3 py-4 ${isPrint ? 'text-slate-500' : 'text-slate-400'}`} colSpan={5}>
                      No strict-law findings for current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">3. Behavioral Findings (Heuristics)</h2>
          <div className={`mt-3 overflow-x-auto rounded-sm border ${isPrint ? 'border-slate-300' : 'border-slate-800 bg-slate-900'}`}>
            <table className="min-w-full text-sm">
              <thead className={`${isPrint ? 'bg-slate-50' : 'bg-slate-950'} text-left text-xs uppercase tracking-wide text-slate-500`}>
                <tr>
                  <th className="px-3 py-2">Indicator</th>
                  <th className="px-3 py-2">Agency</th>
                  <th className="px-3 py-2">Confidence</th>
                  <th className="px-3 py-2">Challenge</th>
                  <th className="px-3 py-2">Citation</th>
                </tr>
              </thead>
              <tbody>
                {heuristicFindings.map((item) => (
                  <tr key={item.id} className={`border-t ${isPrint ? 'border-slate-200' : 'border-slate-800'}`}>
                    <td className="px-3 py-3">{item.indicator}</td>
                    <td className="px-3 py-3">{item.agency}</td>
                    <td className="px-3 py-3 font-mono">{Math.round(item.confidence * 100)}%</td>
                    <td className="px-3 py-3 font-mono">{item.challengeScore ?? 0}%</td>
                    <td className="px-3 py-3">
                      <a className={`font-mono ${isPrint ? 'text-emerald-700' : 'text-emerald-400'} underline`} href={statuteLibrary[item.citationKey].url} target="_blank" rel="noreferrer">
                        {item.citation}
                      </a>
                    </td>
                  </tr>
                ))}
                {heuristicFindings.length === 0 && (
                  <tr>
                    <td className={`px-3 py-4 ${isPrint ? 'text-slate-500' : 'text-slate-400'}`} colSpan={5}>
                      No heuristic findings for current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">4. Action Items (Next BOE/BPW Cycle)</h2>
          <ol className={`mt-3 list-decimal space-y-2 pl-5 text-sm ${isPrint ? 'text-slate-800' : 'text-slate-200'}`}>
            {actionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
        <footer className={`border-t pt-3 font-mono text-xs ${isPrint ? 'border-slate-300 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
          Integrity Seal: {snapshotId} • Generated At: {generatedAt}
        </footer>
      </div>
    </main>
  );
}
