'use client';

import Link from 'next/link';
import type { ShieldMode } from '@/components/search/ForensicSearch';

function currency(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export default function VerdictCard({
  mode,
  asset,
  compliance,
}: {
  mode: ShieldMode;
  asset?: { refund: number; shieldCost: number };
  compliance?: { currentMonthly: number; bundledMonthly: number };
}) {
  if (mode === 'compliance') {
    const current = compliance?.currentMonthly ?? 800;
    const bundled = compliance?.bundledMonthly ?? 450;
    const annualSavings = Math.max(0, (current - bundled) * 12);

    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Verdict</div>
        <h3 className="mt-2 text-xl font-semibold text-gray-900">Route Efficiency Detected</h3>

        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Current Disposal</span>
            <span className="font-semibold text-rose-600">${currency(current)}/mo</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Bundled Rate</span>
            <span className="font-semibold text-indigo-600">${currency(bundled)}/mo</span>
          </div>
          <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
            <span className="text-gray-600">Annual Savings</span>
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              ${currency(annualSavings)}
            </span>
          </div>
        </div>

        <Link
          href="/compliance-shield"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          Join Route & Certify
        </Link>
      </div>
    );
  }

  const refund = asset?.refund ?? 12450;
  const shieldCost = asset?.shieldCost ?? 2500;
  const netEquity = refund - shieldCost;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Verdict</div>
      <h3 className="mt-2 text-xl font-semibold text-gray-900">Forensic Opportunity Detected</h3>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Est. DPW Refund</span>
          <span className="font-semibold text-emerald-600">+${currency(refund)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Shield Cost</span>
          <span className="font-semibold text-gray-700">-${currency(shieldCost)}</span>
        </div>
        <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
          <span className="text-gray-600">Net Equity</span>
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            ${currency(netEquity)}
          </span>
        </div>
      </div>

      <Link
        href="/claims?zip=21201"
        className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
      >
        Start Recovery Claim
      </Link>
    </div>
  );
}

