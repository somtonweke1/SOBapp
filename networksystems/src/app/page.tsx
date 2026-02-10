'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ThreeDNetworkMap from '@/components/visualization/3d-network-map';

export default function SOBLandingPage() {
  const [billAmount, setBillAmount] = useState('');
  const billValue = Number(billAmount);

  const estimatedRecovery = useMemo(() => {
    if (!Number.isFinite(billValue) || billValue <= 0) return null;
    return billValue * 0.18;
  }, [billValue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="border-b border-zinc-200/50 pb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Sons of Baltimore Forensics</p>
          <h1 className="mt-4 text-5xl sm:text-6xl font-extralight tracking-tight text-zinc-900">
            Stop the Theft. Audit the 410.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-zinc-600 font-light">
            SOBapp is the only infrastructure forensics engine built to recover property overcharges and protect your cash flow.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/auth/signup"
              className="relative inline-flex items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_0_20px_rgba(34,197,94,0.35)] transition hover:bg-emerald-700"
            >
              Access the War Room
            </Link>
            <Link
              href="/audit"
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              Run a Quick Audit
            </Link>
          </div>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-8 shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Instant Audit</p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-900">Quick Scan</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Enter your latest DPW bill to estimate potential recovery.
            </p>
            <div className="mt-6 space-y-4">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Total Bill Amount ($)"
                value={billAmount}
                onChange={(event) => setBillAmount(event.target.value)}
                className="w-full rounded-lg border border-zinc-200/50 bg-white/95 px-4 py-3 text-sm text-zinc-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-700">
                {estimatedRecovery
                  ? `Estimated Recovery: $${estimatedRecovery.toFixed(2)}`
                  : 'Estimated Recovery: Enter a bill to scan.'}
              </div>
              <Link
                href="/auth/signup"
                className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Get My Abatement Letter
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-8 shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Live Signal</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-900">DPW API Status: ACTIVE</h3>
            <p className="mt-2 text-sm text-zinc-600">NODE SCAN: 410_BALTIMORE</p>
            <div className="mt-6 space-y-4 text-sm text-zinc-600">
              <div className="flex items-center justify-between">
                <span>Audits in Queue</span>
                <span className="text-emerald-600 font-semibold">128</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Average Overcharge</span>
                <span className="text-red-600 font-semibold">$342.12</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active DPW Flags</span>
                <span className="text-amber-600 font-semibold">47</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-zinc-200/50 bg-white/70 p-8 shadow-2xl backdrop-blur">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80">
            <div className="absolute inset-0">
              <ThreeDNetworkMap nodes={[]} edges={[]} />
            </div>
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
            <div className="relative px-8 py-10">
              <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">The War Room</p>
              <h2 className="mt-3 text-3xl font-semibold text-zinc-900">
                Proprietary 3D Infrastructure Mapping & Legal Dispute Engine
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-zinc-600">
                A ghosted look at the system members use to trace property links, DPW anomalies, and lien risk in real time.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'Forensic Auditing',
                    description: 'Automated DPW discrepancy detection and evidence capture.'
                  },
                  {
                    title: 'Legal Abatement',
                    description: 'One-click dispute letters built from your audit trail.'
                  },
                  {
                    title: 'Portfolio Shield',
                    description: 'Live monitoring for liens, infra risk, and cash flow leaks.'
                  }
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-zinc-200/60 bg-white/85 p-5 text-sm text-zinc-600 shadow-lg"
                  >
                    <h3 className="text-base font-semibold text-zinc-900">{card.title}</h3>
                    <p className="mt-2 font-light">{card.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center rounded-full border border-emerald-400/70 bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_0_18px_rgba(34,197,94,0.35)] transition hover:bg-emerald-700"
                >
                  Secure My Portfolio
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
