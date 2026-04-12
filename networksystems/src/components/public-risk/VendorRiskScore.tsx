'use client';

import type { RiskFlag } from '@/lib/risk/engine';

type VendorRiskRow = {
  vendor: string;
  agencies: number;
  flags: number;
  highFlags: number;
  strictFlags: number;
  exposure: number;
  score: number;
};

type Props = {
  flags: RiskFlag[];
  onSelectVendor?: (vendor: string) => void;
};

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function buildVendorRiskRows(flags: RiskFlag[]): VendorRiskRow[] {
  const groups = new Map<string, RiskFlag[]>();
  for (const flag of flags) {
    groups.set(flag.vendor, [...(groups.get(flag.vendor) || []), flag]);
  }

  const rows: VendorRiskRow[] = [];
  for (const [vendor, vendorFlags] of groups) {
    const agencies = new Set(vendorFlags.map((f) => f.agency)).size;
    const highFlags = vendorFlags.filter((f) => f.severity === 'HIGH').length;
    const strictFlags = vendorFlags.filter((f) => f.basis === 'STRICT_LAW').length;
    const exposure = vendorFlags.reduce((sum, f) => sum + f.exposure, 0);
    const score = highFlags * 30 + strictFlags * 20 + vendorFlags.length * 10 + Math.min(exposure / 250000, 40);

    rows.push({
      vendor,
      agencies,
      flags: vendorFlags.length,
      highFlags,
      strictFlags,
      exposure,
      score: Math.round(score),
    });
  }

  return rows.sort((a, b) => b.score - a.score).slice(0, 8);
}

export default function VendorRiskScore({ flags, onSelectVendor }: Props) {
  const rows = buildVendorRiskRows(flags);

  return (
    <section className="rounded-sm border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Vendor Risk Score</h2>
        <span className="rounded-sm bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">Top 8</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Vendor</th>
              <th className="px-3 py-2">Score</th>
              <th className="px-3 py-2">Flags</th>
              <th className="px-3 py-2">Agencies</th>
              <th className="px-3 py-2">Exposure</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.vendor}
                className="cursor-pointer border-b border-slate-800 hover:bg-slate-800/40"
                onClick={() => onSelectVendor?.(row.vendor)}
              >
                <td className="px-3 py-3 font-mono font-medium text-slate-100">{row.vendor}</td>
                <td className="px-3 py-3 font-mono text-slate-100">{row.score}</td>
                <td className="px-3 py-3 text-slate-300">
                  {row.flags} ({row.highFlags} high / {row.strictFlags} strict)
                </td>
                <td className="px-3 py-3 text-slate-300">{row.agencies}</td>
                <td className="px-3 py-3 font-mono text-slate-100">{currency(row.exposure)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-slate-500" colSpan={5}>
                  No vendor risk scores available for current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
