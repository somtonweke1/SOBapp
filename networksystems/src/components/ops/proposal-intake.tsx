import type { HighBleedVendor } from '@/lib/data-sources';

type CoreNeedKey = 'invoiceLeakage';

type Props = {
  bleedVendors: HighBleedVendor[];
  defaults: {
    company: string;
    need: CoreNeedKey;
    annualLeakage: number;
    key?: string;
  };
};

const NEED_OPTIONS: Array<{ value: CoreNeedKey; label: string }> = [
  { value: 'invoiceLeakage', label: 'Invoice Leakage and Payment Drag' },
];

function buildHref(params: { company: string; need: CoreNeedKey; annualLeakage: number; key?: string }) {
  const query = new URLSearchParams();
  query.set('company', params.company);
  query.set('need', params.need);
  query.set('annualLeakage', String(Math.max(50000, Math.round(params.annualLeakage))));
  if (params.key) query.set('key', params.key);
  return `/ops/proposal?${query.toString()}`;
}

export default function ProposalIntake({ bleedVendors, defaults }: Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white/80 p-6">
      <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Solution Packaging Studio</p>
      <h2 className="mt-2 text-xl font-light text-zinc-900">Generate a Company-Specific Software Offer</h2>
      <p className="mt-2 text-sm font-light text-zinc-600">
        Pick a target below or enter any company. The proposal updates into a product package with modules, SLA, and pricing.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {bleedVendors.map((vendor) => (
          <a
            key={`${vendor.vendorName}-${vendor.spendCategory}`}
            href={buildHref({
              company: vendor.vendorName,
              need: 'invoiceLeakage',
              annualLeakage: Math.max(vendor.penaltyTotal || 0, defaults.annualLeakage, 50000),
              key: defaults.key,
            })}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:bg-zinc-100"
          >
            <p className="text-sm font-medium text-zinc-900">{vendor.vendorName}</p>
            <p className="mt-1 text-xs text-zinc-600">Quick package: invoice leakage</p>
            <p className="mt-2 text-xs font-light uppercase tracking-[0.2em] text-zinc-500">
              Exposure baseline: ${Math.round(vendor.penaltyTotal || 0).toLocaleString()}
            </p>
          </a>
        ))}
      </div>

      <form action="/ops/proposal" method="get" className="mt-6 grid gap-3 md:grid-cols-4">
        {defaults.key && <input type="hidden" name="key" value={defaults.key} />}
        <label className="grid gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
          Company
          <input
            name="company"
            defaultValue={defaults.company}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-light normal-case tracking-normal text-zinc-900 outline-none focus:border-zinc-400"
            placeholder="Acme Infrastructure"
            required
          />
        </label>
        <label className="grid gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
          Core Need
          <select
            name="need"
            defaultValue={defaults.need}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-light normal-case tracking-normal text-zinc-900 outline-none focus:border-zinc-400"
          >
            {NEED_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
          Annual Exposure (USD)
          <input
            type="number"
            min={0}
            step={1000}
            name="annualLeakage"
            defaultValue={Math.round(defaults.annualLeakage)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-light normal-case tracking-normal text-zinc-900 outline-none focus:border-zinc-400"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-xs font-light uppercase tracking-[0.24em] text-white transition-colors hover:bg-zinc-800"
          >
            Generate Package
          </button>
        </div>
      </form>
    </section>
  );
}
