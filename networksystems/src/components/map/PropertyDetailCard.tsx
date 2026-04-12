'use client';

import Link from 'next/link';
import type { ForensicMode } from './ForensicMap';

function currency(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function PropertyDetailCard({
  property,
  mode,
}: {
  property: any;
  mode: ForensicMode;
}) {
  if (!property) return null;

  if (mode === 'compliance') {
    if (property.type === 'route_cluster') {
      return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Compliance Shield</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Bundled Route Cluster</h3>
          <p className="mt-2 text-sm text-gray-600">
            Route density is <span className="font-semibold text-gray-900">{property.density}</span>. Joining this bundle typically reduces pickup cost by{' '}
            <span className="font-semibold text-indigo-600">{property.estSavingsPct}%</span>.
          </p>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Sites in bundle</span>
              <span className="font-semibold text-gray-900">{property.count}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-600">Estimated savings (monthly)</span>
              <span className="font-semibold text-gray-900">${currency(property.estSavingsMonthly ?? 0)}</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/compliance-shield"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              Open Compliance Shield
            </Link>
            <Link
              href="/compliance-shield/report"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View Evidence Packet
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Compliance Shield</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">{property.name ?? 'Dental Site'}</h3>
        <p className="mt-1 text-sm text-gray-600">{property.address}</p>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Route density</span>
            <span className="font-semibold text-gray-900">High</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">Est. savings</span>
            <span className="font-semibold text-gray-900">${currency(property.estSavingsMonthly ?? 0)}/mo</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/compliance-shield"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Start Waste Manifest
          </Link>
          <Link
            href="/claims?zip=21201"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Request Bundled Pickup
          </Link>
        </div>
      </div>
    );
  }

  // Asset mode
  const lienAmount = Number(property.lienAmount ?? 0);
  const remediationCost = Number(property.remediationCost ?? 0);
  const historicalUse = Array.isArray(property.historicalUse) ? property.historicalUse : [];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Asset Shield</p>
      <h3 className="mt-2 text-lg font-semibold text-gray-900">Liability Card</h3>
      <p className="mt-1 text-sm text-gray-600">{property.address}</p>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Active DPW lien</span>
            <span className={`font-semibold ${lienAmount > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              ${currency(lienAmount)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">Est. remediation cost</span>
            <span className="font-semibold text-gray-900">${currency(remediationCost)}</span>
          </div>
          {historicalUse.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {historicalUse.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800"
                >
                  Historical {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Recommendation</div>
          <p className="mt-2 text-sm text-gray-700">
            Acquire distressed assets by quantifying true CERCLA exposure and converting recoverable leakage into leverage.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/claims?zip=21201`}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
        >
          Acquire This
        </Link>
        <Link
          href="/audit"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Run DPW Audit
        </Link>
      </div>
    </div>
  );
}

