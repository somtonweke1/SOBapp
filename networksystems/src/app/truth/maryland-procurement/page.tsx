import TruthCaseClient from './TruthCaseClient';
import { runMarylandProcurementTruthCase } from '@/lib/risk/truth-engine';

export const dynamic = 'force-dynamic';

function pct(value: number | null): string {
  if (value === null) return 'N/A';
  return `${Math.round(value * 100)}%`;
}

function boolLabel(value: boolean | null): string {
  if (value === null) return 'Pending Reviews';
  return value ? 'PASS' : 'FAIL';
}

export default async function MarylandProcurementTruthPage() {
  try {
    const report = await runMarylandProcurementTruthCase();

    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-10 text-zinc-700">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="rounded-2xl border border-zinc-200/60 bg-white/90 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Truth-Oriented Product Slice</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">Maryland Procurement Truth Engine</h1>
          <p className="mt-3 max-w-4xl text-sm text-zinc-600">
            {report.useCase.job}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/api/truth/maryland-procurement/dossier"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              One-Click Export Dossier (PDF)
            </a>
            <a
              href="/api/truth/maryland-procurement"
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              View Raw JSON
            </a>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-zinc-200/60 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Time to Brief</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{report.wowGates.timeToBriefMinutes} min</p>
            <p className="mt-1 text-xs text-zinc-500">Gate &lt; 10 min: {boolLabel(report.wowGates.meetsTimeGate)}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/60 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Precision (Top Flags)</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{pct(report.wowGates.precisionTopFlags)}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Reviews: {report.wowGates.reviewedTopFlags} • Gate &gt;= 80%: {boolLabel(report.wowGates.meetsPrecisionGate)}
            </p>
          </article>
          <article className="rounded-2xl border border-zinc-200/60 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Traceability Coverage</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{pct(report.wowGates.traceabilityCoverage)}</p>
            <p className="mt-1 text-xs text-zinc-500">Gate = 100%: {boolLabel(report.wowGates.meetsTraceabilityGate)}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/60 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Snapshot Change</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{report.snapshot.changes.added}</p>
            <p className="mt-1 text-xs text-zinc-500">new signals vs prior snapshot</p>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-200/60 bg-white/90 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Moat Layer Status</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            <li>Entity Graph: normalized vendor aliases and entity mapping are active in the risk pipeline.</li>
            <li>Auditable Scoring: each flag carries citation, source URL, logic trace, challenge score, and calibrated confidence.</li>
            <li>
              Historical Memory: snapshot <span className="font-mono">{report.snapshot.id}</span> stored with state hash{' '}
              <span className="font-mono">{report.snapshot.stateHash}</span>.
            </li>
            <li>Feedback Loop: analyst accept/reject decisions recalibrate rule confidence over time.</li>
          </ul>
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Why latest change matters</p>
            <ul className="mt-2 space-y-1">
              {report.snapshot.whyItMatters.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <TruthCaseClient initialFlags={report.topFlags} />

        <section className="rounded-2xl border border-zinc-200/60 bg-white/90 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Truth Artifact: Rejected False Positives</h2>
          <p className="mt-2 text-sm text-zinc-600">
            This section is intentionally preserved in every dossier to show rigor, not just wins.
          </p>
          <div className="mt-4 space-y-3">
            {report.rejectedFalsePositives.length === 0 && (
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                No rejected false positives recorded yet. Use the feedback actions above to establish your first adjudication baseline.
              </p>
            )}
            {report.rejectedFalsePositives.map((item) => (
              <div key={`${item.fingerprint}-${item.createdAt}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="font-mono text-xs text-zinc-700">{item.ruleId}</p>
                <p className="mt-2 text-sm text-zinc-700">{item.reason}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {item.reviewer} • {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          </section>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Truth page render failed:', error);
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-10 text-zinc-700">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200/60 bg-white/95 p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Evidence Quality</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Truth Engine temporarily unavailable</h1>
          <p className="mt-3 text-sm text-zinc-600">
            The report service failed to render this request. You can still access the API directly while we recover.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/api/truth/maryland-procurement"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Open Raw JSON
            </a>
            <a
              href="/"
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back to Home
            </a>
          </div>
        </div>
      </main>
    );
  }
}
