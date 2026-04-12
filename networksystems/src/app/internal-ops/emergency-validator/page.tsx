import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { runAutoScannerIfStale } from '@/lib/risk/auto-scanner';
import { getScannerInsights } from '@/lib/risk/scanner-insights';
import { buildEmergencyValidation } from '@/lib/risk/emergency-validator';

export const dynamic = 'force-dynamic';

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function statusClass(status: 'GREEN' | 'AMBER' | 'RED'): string {
  if (status === 'GREEN') return 'bg-emerald-100 text-emerald-700';
  if (status === 'AMBER') return 'bg-amber-100 text-amber-700';
  return 'bg-rose-100 text-rose-700';
}

export default async function EmergencyValidatorPage() {
  await runAutoScannerIfStale(24 * 60);
  const [records, insights] = await Promise.all([ingestProcurementData(), getScannerInsights(7)]);
  const results = buildEmergencyValidation(records).sort((a, b) => b.amount - a.amount);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-zinc-200/60 bg-white/90 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Control Layer</p>
          <h1 className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">Emergency Procurement Validator</h1>
          <p className="mt-2 text-sm text-zinc-700">
            Red/Amber/Green validation with statute citations, existing-contract cross-check, and exception packet output.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Scanner freshness: {insights.freshness.isStale ? 'stale' : 'fresh'} · latest finding {insights.freshness.latestFindingAt
              ? new Date(insights.freshness.latestFindingAt).toLocaleString()
              : 'n/a'}
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Emergency Records</p>
            <p className="mt-1 text-2xl font-medium text-zinc-900">{results.length}</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Red</p>
            <p className="mt-1 text-2xl font-medium text-rose-700">{results.filter((r) => r.status === 'RED').length}</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Amber</p>
            <p className="mt-1 text-2xl font-medium text-amber-700">{results.filter((r) => r.status === 'AMBER').length}</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Green</p>
            <p className="mt-1 text-2xl font-medium text-emerald-700">{results.filter((r) => r.status === 'GREEN').length}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-200/60 bg-white/95 p-6 shadow-sm">
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Record</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Contract Cross-Check</th>
                  <th className="px-4 py-3">Exception Packet</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item) => (
                  <tr key={item.recordId} className="border-t border-zinc-200/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{item.agency}</p>
                      <p className="text-xs text-zinc-600">{item.vendor} · {item.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{item.score}%</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{currency(item.amount)}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {item.matchedContracts.length > 0
                        ? `${item.matchedContracts.length} potential contract match(es)`
                        : 'No active contract match'}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/api/internal-ops/emergency-validator/packet?recordId=${encodeURIComponent(item.recordId)}`}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                      >
                        Export JSON
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
