import Link from 'next/link';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';

export const dynamic = 'force-dynamic';

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DossierBuilderPage({
  searchParams,
}: {
  searchParams?: { agency?: string };
}) {
  const records = await ingestProcurementData();
  const flags = analyzePortfolioRisk(records);
  const agencies = [...new Set(flags.map((flag) => flag.agency))].sort();

  const agency = searchParams?.agency || agencies[0] || '';
  const scoped = flags.filter((flag) => (agency ? flag.agency === agency : true));

  const query = new URLSearchParams();
  if (agency) query.set('jurisdiction', scoped[0]?.jurisdiction || 'Maryland State');
  const memoHref = `/public-risk/memo${query.toString() ? `?${query.toString()}` : ''}`;
  const pdfHref = `/api/pdf/public-risk-memo${query.toString() ? `?${query.toString()}` : ''}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-zinc-200/50 bg-white/90 p-8 shadow-sm backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Internal Operations</p>
          <h1 className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">Dossier Builder</h1>
          <p className="mt-2 text-sm font-light text-zinc-600">Select agency, run adversarial risk view, export immutable client briefing.</p>

          <form className="mt-4 flex gap-3" method="GET">
            <select
              name="agency"
              defaultValue={agency}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            >
              {agencies.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-light text-white">Load</button>
          </form>

          <div className="mt-5 flex gap-3">
            <Link href={memoHref} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-light text-zinc-700">
              Preview Binder
            </Link>
            <a href={pdfHref} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-light text-white hover:bg-emerald-700">
              Export PDF Dossier
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/50 bg-white/85 p-8 shadow-sm backdrop-blur-md">
          <h2 className="text-xl font-extralight tracking-tight text-zinc-900">Current Findings</h2>
          <div className="mt-4 space-y-3">
            {scoped.slice(0, 10).map((flag) => (
              <div key={flag.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                <p className="text-sm font-light text-zinc-900">{flag.indicator}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {flag.vendor} • {currency(flag.exposure)} • {flag.citation} • {(flag.challengeScore || 0)}% defensible
                </p>
              </div>
            ))}
            {scoped.length === 0 && <p className="text-sm text-zinc-500">No findings in selected agency scope.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
