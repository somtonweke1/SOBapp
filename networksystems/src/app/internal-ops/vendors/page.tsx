import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { resolveProcurementVendors } from '@/lib/risk/vendor-resolution';

export const dynamic = 'force-dynamic';

type VendorRow = {
  id: string;
  name: string;
  aliases: number;
  contracts: number;
  exposure: number;
  strict: number;
  heuristics: number;
};

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function InternalVendorsPage() {
  const records = await ingestProcurementData();
  const flags = analyzePortfolioRisk(records);
  const { records: resolved, entities } = resolveProcurementVendors(records);

  const rows: VendorRow[] = entities.map((entity) => {
    const entityRecords = resolved.filter((row) => row.vendorEntityId === entity.id);
    const entityFlags = flags.filter((row) => row.vendorEntityId === entity.id);
    return {
      id: entity.id,
      name: entity.canonicalName,
      aliases: entity.aliases.length,
      contracts: entityRecords.length,
      exposure: entityFlags.reduce((sum, row) => sum + row.exposure, 0),
      strict: entityFlags.filter((row) => row.basis === 'STRICT_LAW').length,
      heuristics: entityFlags.filter((row) => row.basis === 'RISK_HEURISTIC').length,
    };
  });

  const topRows = rows.sort((a, b) => b.exposure - a.exposure);
  const totalExposure = topRows.reduce((sum, row) => sum + row.exposure, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-zinc-200/50 bg-white/90 p-8 shadow-sm backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Entity Intelligence</p>
          <h1 className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">Resolved Vendor Entity Graph</h1>
          <p className="mt-2 text-sm font-light text-zinc-600">
            Canonical vendor profiles with alias collapse, contract concentration, and risk exposure.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Resolved Entities</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">{topRows.length}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Aggregate Exposure</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-emerald-600">{currency(totalExposure)}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">High-Risk Entities</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-rose-600">
              {topRows.filter((row) => row.strict > 0 || row.heuristics > 1).length}
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-200/50 bg-white/90 p-8 shadow-sm backdrop-blur-md">
          <div className="overflow-x-auto rounded-2xl border border-zinc-200/60">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-[0.16em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Aliases</th>
                  <th className="px-4 py-3">Contracts</th>
                  <th className="px-4 py-3">Exposure</th>
                  <th className="px-4 py-3">Strict</th>
                  <th className="px-4 py-3">Heuristics</th>
                </tr>
              </thead>
              <tbody>
                {topRows.map((row, index) => (
                  <tr key={row.id} className={`border-t border-zinc-200/70 ${index % 2 === 0 ? 'bg-white/70' : 'bg-zinc-50/50'}`}>
                    <td className="px-4 py-3 font-light text-zinc-900">{row.name}</td>
                    <td className="px-4 py-3 font-medium text-zinc-700">{row.aliases}</td>
                    <td className="px-4 py-3 font-medium text-zinc-700">{row.contracts}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900">{currency(row.exposure)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600">{row.strict}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600">{row.heuristics}</span>
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
