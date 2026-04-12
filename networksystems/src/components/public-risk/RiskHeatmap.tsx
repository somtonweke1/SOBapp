'use client';

import type { RiskFlag } from '@/lib/risk/engine';

type AgencyExposure = {
  agency: string;
  exposure: number;
  highCount: number;
  strictCount: number;
  intensity: number;
};

type Props = {
  flags: RiskFlag[];
};

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function buildAgencyExposure(flags: RiskFlag[]): AgencyExposure[] {
  const totals = new Map<string, { exposure: number; highCount: number; strictCount: number }>();
  for (const flag of flags) {
    const current = totals.get(flag.agency) || { exposure: 0, highCount: 0, strictCount: 0 };
    current.exposure += flag.exposure;
    if (flag.severity === 'HIGH') current.highCount += 1;
    if (flag.basis === 'STRICT_LAW') current.strictCount += 1;
    totals.set(flag.agency, current);
  }

  const maxExposure = Math.max(...[...totals.values()].map((v) => v.exposure), 1);
  return [...totals.entries()]
    .map(([agency, v]) => ({
      agency,
      exposure: v.exposure,
      highCount: v.highCount,
      strictCount: v.strictCount,
      intensity: Math.max(0.12, v.exposure / maxExposure),
    }))
    .sort((a, b) => b.exposure - a.exposure)
    .slice(0, 10);
}

export default function RiskHeatmap({ flags }: Props) {
  const agencies = buildAgencyExposure(flags);

  return (
    <section className="rounded-sm border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Risk Heatmap</h2>
        <span className="rounded-sm bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">Top agencies by exposure</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {agencies.map((agency) => (
          <div
            key={agency.agency}
            className="rounded-sm border border-slate-800 p-3"
            style={{
              backgroundColor: `rgba(239, 68, 68, ${Math.max(agency.intensity * 0.6, 0.08)})`,
            }}
          >
            <div className="font-mono text-sm font-semibold text-white">{agency.agency}</div>
            <div className="mt-1 font-mono text-xs text-slate-100">
              Exposure: <span className="font-semibold">{currency(agency.exposure)}</span>
            </div>
            <div className="text-xs text-slate-200">
              {agency.highCount} high-risk • {agency.strictCount} strict-law
            </div>
          </div>
        ))}
        {agencies.length === 0 && (
          <div className="col-span-full rounded-sm border border-slate-800 p-4 text-sm text-slate-500">
            No heatmap data for current filters.
          </div>
        )}
      </div>
    </section>
  );
}
