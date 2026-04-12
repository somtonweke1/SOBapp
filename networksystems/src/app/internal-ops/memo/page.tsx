import Link from 'next/link';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { generateSnapshotId } from '@/lib/risk/integrity';
import { buildPreEscalationPlaybook } from '@/lib/risk/pre-escalation-playbook';

export const dynamic = 'force-dynamic';

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function InternalMemoPage() {
  const generatedAt = new Date().toISOString();
  const records = await ingestProcurementData();
  const flags = analyzePortfolioRisk(records);
  const strictFindings = flags.filter((f) => f.basis === 'STRICT_LAW').sort((a, b) => b.exposure - a.exposure);
  const heuristicFindings = flags.filter((f) => f.basis === 'RISK_HEURISTIC').sort((a, b) => b.exposure - a.exposure);
  const totalExposure = flags.reduce((sum, f) => sum + f.exposure, 0);
  const snapshotId = generateSnapshotId(flags, generatedAt);
  const pdfHref = `/api/pdf/public-risk-memo?generatedAt=${encodeURIComponent(generatedAt)}`;
  const playbook = buildPreEscalationPlaybook(flags);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-zinc-200/50 bg-white/90 p-8 shadow-sm backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Evidence Vault</p>
              <h1 className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">Executive Evidence Binder</h1>
              <p className="mt-2 text-sm font-light text-zinc-600">Generated {new Date(generatedAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/internal-ops/dossier-builder"
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-light text-zinc-700 hover:bg-zinc-50"
              >
                Open Builder
              </Link>
              <a
                href={pdfHref}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-light text-white hover:bg-emerald-700"
              >
                Export PDF
              </a>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium tracking-wide text-zinc-500">Snapshot ID: {snapshotId}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Total Exposure</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-emerald-600">{currency(totalExposure)}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Strict-Law Findings</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-rose-600">{strictFindings.length}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Heuristic Findings</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-amber-600">{heuristicFindings.length}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-200/50 bg-white/90 p-8 shadow-sm backdrop-blur-md">
          <h2 className="text-2xl font-extralight tracking-tight text-zinc-900">Statutory Findings</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200/60">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Indicator</th>
                  <th className="px-4 py-3">Agency</th>
                  <th className="px-4 py-3">Exposure</th>
                  <th className="px-4 py-3">Defensibility</th>
                </tr>
              </thead>
              <tbody>
                {strictFindings.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-t border-zinc-200/70">
                    <td className="px-4 py-3 font-light text-zinc-900">{item.indicator}</td>
                    <td className="px-4 py-3 font-light text-zinc-700">{item.agency}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{currency(item.exposure)}</td>
                    <td className="px-4 py-3 font-medium text-zinc-700">{item.challengeScore ?? 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/50 bg-white/90 p-8 shadow-sm backdrop-blur-md">
          <h2 className="text-2xl font-extralight tracking-tight text-zinc-900">Pre-Escalation Solutions</h2>
          <div className="mt-4 space-y-4">
            {playbook.map((item) => (
              <article key={item.question} className="rounded-xl border border-zinc-200/60 bg-zinc-50/70 p-4">
                <p className="text-sm font-medium text-zinc-900">Question: {item.question}</p>
                <p className="mt-1 text-sm font-light text-zinc-700">Solution: {item.solution}</p>
                <p className="mt-1 text-xs text-zinc-600">Required evidence: {item.requiredEvidence}</p>
                <p className="mt-1 text-xs text-zinc-500">Owner: {item.owner}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
