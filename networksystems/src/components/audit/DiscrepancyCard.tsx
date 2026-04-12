'use client';

import Link from 'next/link';

type CardMode = 'asset' | 'compliance';

export default function DiscrepancyCard({
  mode,
  address,
}: {
  mode: CardMode;
  address: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Discrepancy Report</div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Record vs. Reality</h2>
          <p className="mt-2 text-sm text-gray-600">{address}</p>
        </div>
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            mode === 'asset'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {mode === 'asset'
            ? 'OVERCHARGE DETECTED'
            : 'COMPLIANCE GAP DETECTED'}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Public Record</div>
          {mode === 'asset' ? (
            <div className="mt-2 text-sm text-gray-800">
              Commercial Usage (2-inch Meter) - Base Rate $450/mo.
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-800">
              Active Dental Practice (Towson).
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Reality</div>
          {mode === 'asset' ? (
            <div className="mt-2 text-sm text-gray-800">
              Residential Volume - Should be $45/mo.
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-800">
              EPA Database: No Amalgam Separator Inspection filed in 24 months.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Verdict</div>
        {mode === 'asset' ? (
          <div className="mt-2 text-lg font-semibold text-emerald-700">
            OVERCHARGE DETECTED: $14,580 (3-Year Statute).
          </div>
        ) : (
          <div className="mt-2 text-lg font-semibold text-rose-700">
            COMPLIANCE GAP: Clean Water Act Violation.
          </div>
        )}
        <p className="mt-2 text-sm text-gray-600">
          This is a demo scenario showing how StoneBridge triangulates public record signals against the supplied document.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={mode === 'asset' ? '/abatement' : '/compliance-shield/report'}
          className={`inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-sm ${
            mode === 'asset' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          Generate Abatement Packet
        </Link>
        <Link
          href={mode === 'asset' ? '/claims?zip=21201' : '/compliance-shield'}
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          {mode === 'asset' ? 'Start Recovery Claim' : 'Open Compliance Shield'}
        </Link>
      </div>
    </div>
  );
}

