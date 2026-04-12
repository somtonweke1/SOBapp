import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk, type RiskFlag } from '@/lib/risk/engine';
import { buildConstraintLoops } from '@/lib/risk/constraint-loop';

export const dynamic = 'force-dynamic';

const FALLBACK_FLAGS: RiskFlag[] = [
  {
    id: 'internal-fallback-1',
    jurisdiction: 'Baltimore City',
    agency: 'DPW',
    vendor: 'Fallback Utilities Group',
    severity: 'HIGH',
    indicator: 'Utility leakage exposure in ZIP 21201',
    basis: 'RISK_HEURISTIC',
    citationKey: 'BALT_CHARTER_ART_VI_11',
    citation: 'Baltimore City Charter Art. VI, §11',
    confidence: 0.76,
    exposure: 420000,
    sourceUrl:
      'https://services1.arcgis.com/UWYHeuuJISiGmgXx/ArcGIS/rest/services/OpenCheckbookFY2022_Through_Present/FeatureServer/1',
    logicTrace: 'Fallback signal for internal ops dashboard.',
    zipCode: '21201',
    dataLane: 'BALTIMORE_UTILITY_LEAKAGE',
  },
  {
    id: 'internal-fallback-2',
    jurisdiction: 'Maryland State',
    agency: 'DGS',
    vendor: 'Fallback Infrastructure LLC',
    severity: 'MEDIUM',
    indicator: 'Potential contract splitting pattern across small procurements',
    basis: 'STRICT_LAW',
    citationKey: 'COMAR_21_05_07_05A',
    citation: 'COMAR 21.05.07.05(A)',
    confidence: 0.81,
    exposure: 265000,
    sourceUrl: 'https://procurement.maryland.gov/',
    logicTrace: 'Fallback signal for internal ops dashboard.',
    dataLane: 'PROCUREMENT_GENERAL',
  },
];

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function InternalOpsDashboardPage() {
  let flags: RiskFlag[] = [];
  let recordsCount = 0;

  try {
    const records = await ingestProcurementData();
    flags = analyzePortfolioRisk(records);
    recordsCount = records.length;
  } catch (error) {
    console.error('Internal ops dashboard failed to load live feed. Using fallback.', error);
    flags = FALLBACK_FLAGS;
    recordsCount = FALLBACK_FLAGS.length;
  }

  const loops = buildConstraintLoops(flags).slice(0, 12);
  const bridgedCount = loops.filter((loop) => loop.status === 'BRIDGED').length;
  const loopBreakRate = loops.length === 0 ? 0 : Math.round((bridgedCount / loops.length) * 100);
  const totalExposure = loops.reduce((sum, loop) => sum + loop.exposure, 0);

  return (
    <main className="min-h-screen px-6 pb-12 pt-8 md:px-10">
      <section className="mb-8 rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Oversight Engine v2.0</p>
            <h2 className="mt-1 text-3xl font-extralight tracking-tight text-zinc-900">Internal Risk Feed + Constraint Loops</h2>
          </div>
          <a
            href="/public-risk/dashboard"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-light text-white hover:bg-black"
          >
            Open Public Loop Dashboard
          </a>
        </div>
        <p className="text-sm font-light text-zinc-600">
          Generated {new Date().toLocaleString()} from {recordsCount} records.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <article className="rounded-2xl border border-zinc-200/50 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Total Loops</p>
            <p className="mt-2 text-2xl font-extralight tracking-tight text-zinc-900">{loops.length}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Loop Break Rate</p>
            <p className="mt-2 text-2xl font-extralight tracking-tight text-zinc-900">{loopBreakRate}%</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Total Exposure</p>
            <p className="mt-2 text-2xl font-extralight tracking-tight text-zinc-900">{currency(totalExposure)}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Signals</p>
            <p className="mt-2 text-2xl font-extralight tracking-tight text-zinc-900">{flags.length}</p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Constraint Engine</p>
          <h3 className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">Constraint Loop Gallery</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {loops.map((loop) => (
            <article key={loop.id} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">{loop.vendor}</p>
                <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs uppercase tracking-[0.12em] text-zinc-600">
                  {loop.status}
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                {loop.type.replace('_', ' ')} · {loop.agency}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md border border-zinc-200 bg-white p-2">
                  <p className="text-zinc-500">Tension</p>
                  <p className="font-medium text-zinc-900">{loop.tensionScore}</p>
                </div>
                <div className="rounded-md border border-zinc-200 bg-white p-2">
                  <p className="text-zinc-500">Signals</p>
                  <p className="font-medium text-zinc-900">{loop.signals.length}</p>
                </div>
                <div className="rounded-md border border-zinc-200 bg-white p-2">
                  <p className="text-zinc-500">Exposure</p>
                  <p className="font-medium text-zinc-900">{currency(loop.exposure)}</p>
                </div>
              </div>
            </article>
          ))}
          {loops.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              No loops detected yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

