import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import DealIntakeForm from './DealIntakeForm';

export const dynamic = 'force-dynamic';

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function FreeScanPage({
  searchParams,
}: {
  searchParams?: { agency?: string; checkout?: string; address?: string; mode?: string };
}) {
  const selectedAgency = searchParams?.agency || 'MD Department of Health';
  const prefilledAddress = searchParams?.address?.trim() || '';
  const prefilledMode = searchParams?.mode === 'compliance' ? 'compliance' : 'asset';
  const records = await ingestProcurementData();
  const flags = analyzePortfolioRisk(records);

  const agencies = [...new Set(flags.map((flag) => flag.agency))].sort();
  const scoped = flags.filter((flag) => flag.agency === selectedAgency);
  const exposure = scoped.reduce((sum, flag) => sum + flag.exposure, 0);
  const strictCount = scoped.filter((flag) => flag.basis === 'STRICT_LAW').length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-12 text-zinc-700">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-2xl border border-zinc-200/50 bg-white/90 p-8 shadow-sm backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Client Entry Point</p>
          <h1 className="mt-2 text-4xl font-extralight tracking-tight text-zinc-900">Free Preview, Paid Memo</h1>
          <p className="mt-3 max-w-2xl text-sm font-light text-zinc-600">
            Preview the signal layer without exposing the full internal analysis stack. The paid deliverable is the
            24-hour deal memo further down this page.
          </p>
          <p className="mt-3 max-w-3xl text-sm font-light text-zinc-600">
            This scan is anchored to recent public procurement activity visible through Maryland and federal sources
            such as eMMA, DGS, county bid tabs, and SAM.gov. It is meant to identify credible current activity signals
            without overstating that every live bidder list is public.
          </p>
        </header>

        {searchParams?.checkout === 'cancelled' ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-sm text-amber-900 shadow-sm">
            Checkout was canceled. Your preview is still available below, and you can restart the paid memo intake at
            any time.
          </section>
        ) : null}

        {prefilledAddress ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-sm text-emerald-950 shadow-sm">
            Scan context carried over for <span className="font-semibold">{prefilledAddress}</span>. This intake is now
            prefilled for the {prefilledMode === 'compliance' ? 'compliance' : 'asset'} memo path so the buyer can move
            straight from preview into purchase.
          </section>
        ) : null}

        <form className="rounded-2xl border border-zinc-200/50 bg-white/80 p-8 shadow-sm backdrop-blur-md" method="GET">
          <label className="text-sm font-light text-zinc-700">Agency</label>
          <div className="mt-2 flex gap-3">
            <select
              name="agency"
              defaultValue={selectedAgency}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
            >
              {agencies.map((agency) => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-light text-white">Run</button>
          </div>
        </form>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Estimated Exposure</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-emerald-600">{currency(exposure)}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Risk Indicators</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-amber-600">{scoped.length}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Strict-Law Signals</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-rose-600">{strictCount}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/50 bg-white/80 p-8 shadow-sm backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Partial Heatmap (Redacted)</p>
          <div className="mt-4 space-y-3">
            {scoped.slice(0, 5).map((flag) => (
              <div key={flag.id} className="rounded-lg border border-zinc-200 bg-white/70 p-4">
                <p className="text-sm font-light text-zinc-900 blur-[1px]">{flag.indicator}</p>
                <p className="mt-1 text-xs text-zinc-500 blur-[2px]">Vendor and statute details unlocked in full briefing pack</p>
              </div>
            ))}
            {scoped.length === 0 && <p className="text-sm text-zinc-500">No signals in current snapshot for selected agency.</p>}
          </div>
        </section>

        <DealIntakeForm
          previewAgency={selectedAgency}
          initialAssetAddress={prefilledAddress}
          initialGoals={
            prefilledAddress
              ? `Generate a ${prefilledMode === 'compliance' ? 'compliance' : 'deal-risk'} memo for ${prefilledAddress}.`
              : ''
          }
        />
      </div>
    </main>
  );
}
