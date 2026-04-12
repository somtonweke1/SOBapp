import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { buildFixSprintPlan } from '@/lib/risk/fix-sprint';
import { getScannerInsights } from '@/lib/risk/scanner-insights';
import { runAutoScannerIfStale } from '@/lib/risk/auto-scanner';

export const dynamic = 'force-dynamic';

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function FixSprintPage() {
  await runAutoScannerIfStale(24 * 60);
  const [records, insights] = await Promise.all([ingestProcurementData(), getScannerInsights(7)]);
  const flags = analyzePortfolioRisk(records);
  const plan = buildFixSprintPlan(records, flags);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-zinc-200/60 bg-white/90 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">2-Week Sprint Engine</p>
          <h1 className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">Procurement Fix Sprint</h1>
          <p className="mt-2 text-sm font-light text-zinc-700">{plan.objective}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <article className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Fee Band</p>
              <p className="mt-1 text-xl font-medium text-zinc-900">{plan.feeBandUsd}</p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Records</p>
              <p className="mt-1 text-xl font-medium text-zinc-900">{records.length}</p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Findings</p>
              <p className="mt-1 text-xl font-medium text-zinc-900">{flags.length}</p>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Scanner</p>
              <p className="mt-1 text-xl font-medium text-zinc-900">{insights.freshness.isStale ? 'Stale' : 'Fresh'}</p>
            </article>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/60 bg-white/90 p-8 shadow-sm">
          <h2 className="text-2xl font-extralight tracking-tight text-zinc-900">14-Day Execution Plan</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {plan.tasks.map((task) => (
              <article key={`${task.day}-${task.phase}`} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Day {task.day} · {task.phase}</p>
                <p className="mt-1 text-sm font-medium text-zinc-900">{task.objective}</p>
                <p className="mt-1 text-xs text-zinc-600">Deliverable: {task.deliverable}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/60 bg-white/90 p-8 shadow-sm">
          <h2 className="text-2xl font-extralight tracking-tight text-zinc-900">Remediation Queue (Live)</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-[0.14em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Case</th>
                  <th className="px-4 py-3">Exposure</th>
                  <th className="px-4 py-3">Control</th>
                  <th className="px-4 py-3">Owner</th>
                </tr>
              </thead>
              <tbody>
                {plan.remediationQueue.map((item) => (
                  <tr key={item.flagId} className="border-t border-zinc-200/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{item.indicator}</p>
                      <p className="text-xs text-zinc-600">{item.agency} · {item.vendor} · {item.basis}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{currency(item.exposure)}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      <p>{item.recommendedControl}</p>
                      <p className="mt-1 text-xs text-zinc-500">Evidence: {item.requiredEvidence}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{item.ownerRole}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/60 bg-white/90 p-8 shadow-sm">
          <h2 className="text-2xl font-extralight tracking-tight text-zinc-900">Executive Closeout Outputs</h2>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700">
            {plan.executiveCloseout.map((line) => (
              <li key={line}>- {line}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
