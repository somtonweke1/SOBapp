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
    <div className="min-h-screen bg-[#050505] text-emerald-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="border-b border-zinc-200/50 pb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">SYSTEM STATUS</p>
          <h1 className="mt-4 text-5xl sm:text-6xl font-extralight tracking-tight text-emerald-100">
            NODE_MONITORING: ACTIVE
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-emerald-200/80 font-light">
            CAPITAL_LEAK_DETECTION: RUNNING
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/claims"
              className="relative inline-flex items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100 shadow-[0_0_24px_rgba(0,255,65,0.35)] transition hover:bg-emerald-500/20"
            >
              CLAIMS_INTAKE: READY
            </Link>
            <Link
              href="/audit"
              className="rounded-full border border-emerald-400/30 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200/80 transition hover:border-emerald-400/60"
            >
              SIGNAL_OVERVIEW
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/claims?role=landlord"
              className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5 text-left shadow-lg transition hover:border-emerald-300"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Capital Recovery</p>
              <h3 className="mt-2 text-lg font-semibold text-emerald-100">ROLE: LANDLORD</h3>
              <p className="mt-2 text-sm text-emerald-200/80">
                DISCREPANCY_SCAN: DPW OVERCHARGE TRACE
              </p>
            </Link>
            <Link
              href="/claims?role=tenant"
              className="rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-5 text-left shadow-lg transition hover:border-emerald-300"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Compliance Logistics</p>
              <h3 className="mt-2 text-lg font-semibold text-emerald-100">ROLE: TENANT</h3>
              <p className="mt-2 text-sm text-emerald-200/80">
                ROUTE_DENSITY: OPTIMIZATION TRACK
              </p>
            </Link>
          </div>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-8 shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">Signal Probe</p>
            <h2 className="mt-3 text-2xl font-semibold text-emerald-100">DPW Quick Scan</h2>
            <p className="mt-2 text-sm text-emerald-200/80">
              INPUT BILL SIGNAL TO CALIBRATE RECOVERY.
            </p>
            <div className="mt-6 space-y-4">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Total Bill Amount ($)"
                value={billAmount}
                onChange={(event) => setBillAmount(event.target.value)}
                className="w-full rounded-lg border border-emerald-400/30 bg-black/40 px-4 py-3 text-sm text-emerald-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {estimatedRecovery
                  ? `ESTIMATED RECOVERY: $${estimatedRecovery.toFixed(2)}`
                  : 'ESTIMATED RECOVERY: ENTER BILL'}
              </div>
              <Link
                href="/claims"
                className="inline-flex w-full items-center justify-center rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
              >
                CLAIMS_INTAKE: READY
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-8 shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">Live Signal</p>
            <h3 className="mt-3 text-lg font-semibold text-emerald-100">DPW API STATUS: ACTIVE</h3>
            <p className="mt-2 text-sm text-emerald-200/80">NODE SCAN: 410_BALTIMORE</p>
            <div className="mt-6 space-y-4 text-sm text-emerald-200/80">
              <div className="flex items-center justify-between">
                <span>Audits in Queue</span>
                <span className="text-emerald-300 font-semibold">128</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Average Overcharge</span>
                <span className="text-rose-400 font-semibold">$342.12</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Active DPW Flags</span>
                <span className="text-amber-400 font-semibold">47</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-8 shadow-2xl backdrop-blur">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-black/40">
            <div className="absolute inset-0">
              <ThreeDNetworkMap nodes={[]} edges={[]} />
            </div>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative px-8 py-10">
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">WAR_ROOM</p>
              <h2 className="mt-3 text-3xl font-semibold text-emerald-100">
                INFRASTRUCTURE MAP: LIVE
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-emerald-200/80">
                PROPERTY LINKS, DPW ANOMALIES, LIEN RISK — STREAMING.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'Forensic Auditing',
                    description: 'DPW discrepancy detection and evidence capture.'
                  },
                  {
                    title: 'Legal Abatement',
                    description: 'Dispute letters built from audit evidence.'
                  },
                  {
                    title: 'Portfolio Shield',
                    description: 'Live monitoring for liens, infra risk, and cash flow leaks.'
                  }
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5 text-sm text-emerald-200/80 shadow-lg"
                  >
                    <h3 className="text-base font-semibold text-emerald-100">{card.title}</h3>
                    <p className="mt-2 font-light">{card.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/claims"
                  className="inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 shadow-[0_0_18px_rgba(0,255,65,0.35)] transition hover:bg-emerald-500/20"
                >
                  INITIATE CLAIM
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
