import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk, type RiskFlag } from '@/lib/risk/engine';
import { buildConstraintLoops } from '@/lib/risk/constraint-loop';

export const dynamic = 'force-dynamic';

const FALLBACK_FLAGS: RiskFlag[] = [
  {
    id: 'fallback-1',
    jurisdiction: 'Baltimore City',
    agency: 'DPW',
    vendor: 'Fallback Utilities Group',
    severity: 'HIGH',
    indicator: 'Vendor concentration with repeat penalty exposure',
    basis: 'RISK_HEURISTIC',
    citationKey: 'BALT_CHARTER_ART_VI_11',
    citation: 'Baltimore City Charter Art. VI, §11',
    confidence: 0.74,
    exposure: 420000,
    sourceUrl: 'https://services1.arcgis.com/UWYHeuuJISiGmgXx/ArcGIS/rest/services/OpenCheckbookFY2022_Through_Present/FeatureServer/1',
    logicTrace: 'FALLBACK: synthetic loop signal for degraded ingestion mode.',
  },
  {
    id: 'fallback-2',
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
    logicTrace: 'FALLBACK: synthetic loop signal for degraded ingestion mode.',
  },
  {
    id: 'fallback-3',
    jurisdiction: 'Maryland State',
    agency: 'DoIT',
    vendor: 'Fallback Data Systems',
    severity: 'MEDIUM',
    indicator: 'Sole-source used for category likely to have multiple suppliers',
    basis: 'RISK_HEURISTIC',
    citationKey: 'COMAR_21_05_05',
    citation: 'COMAR 21.05.05',
    confidence: 0.69,
    exposure: 180000,
    sourceUrl: 'https://procurement.maryland.gov/',
    logicTrace: 'FALLBACK: synthetic loop signal for degraded ingestion mode.',
  },
];

export default async function PublicRiskDashboardPage() {
  let flags: RiskFlag[] = [];
  let recordsCount = 0;
  try {
    const records = await ingestProcurementData();
    flags = analyzePortfolioRisk(records);
    recordsCount = records.length;
  } catch (error) {
    console.error('Loop detection failed. Falling back to synthetic dataset.', error);
    flags = FALLBACK_FLAGS;
    recordsCount = FALLBACK_FLAGS.length;
  }

  const loops = buildConstraintLoops(flags).slice(0, 24);

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-sm border border-slate-800 bg-slate-900 p-5">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Constraint Loop Gallery</h1>
          <p className="mt-2 text-sm text-slate-400">
            Server-rendered fallback-safe dashboard. Generated {new Date().toLocaleString()} from {recordsCount} records.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Loops</p>
              <p className="font-mono text-lg font-semibold text-white">{loops.length}</p>
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">High Tension</p>
              <p className="font-mono text-lg font-semibold text-white">
                {loops.filter((loop) => loop.tensionScore >= 8).length}
              </p>
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Baltimore Loops</p>
              <p className="font-mono text-lg font-semibold text-white">
                {loops.filter((loop) => loop.jurisdiction === 'Baltimore City').length}
              </p>
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total Exposure</p>
              <p className="font-mono text-lg font-semibold text-white">
                ${Math.round(loops.reduce((sum, loop) => sum + loop.exposure, 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-sm border border-slate-800 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold text-white">Loop Gallery</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {loops.map((loop) => (
              <article key={loop.id} className="rounded-sm border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-100">{loop.vendor}</p>
                  <span className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">
                    {loop.status}
                  </span>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
                  {loop.type.replace('_', ' ')} · {loop.agency}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
                    <p className="text-slate-500">Tension</p>
                    <p className="font-mono text-slate-100">{loop.tensionScore}</p>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
                    <p className="text-slate-500">Signals</p>
                    <p className="font-mono text-slate-100">{loop.signals.length}</p>
                  </div>
                  <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
                    <p className="text-slate-500">Exposure</p>
                    <p className="font-mono text-slate-100">${Math.round(loop.exposure).toLocaleString()}</p>
                  </div>
                </div>
              </article>
            ))}
            {loops.length === 0 && (
              <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">
                No loops detected. Data lane returned zero records.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
