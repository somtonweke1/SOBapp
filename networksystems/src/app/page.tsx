'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { SOB_FORENSICS } from '@/lib/forensics';

type AuditResult = {
  isValid: boolean;
  discrepancy: number;
};

type DSCRResult = {
  ratio: string;
  isFundable: boolean;
};

export default function SOBLandingPage() {
  const [gallons, setGallons] = useState('');
  const [totalBill, setTotalBill] = useState('');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const [rent, setRent] = useState('');
  const [piti, setPiti] = useState('');
  const [dscrResult, setDscrResult] = useState<DSCRResult | null>(null);

  const gallonsValue = Number(gallons);
  const billValue = Number(totalBill);
  const rentValue = Number(rent);
  const pitiValue = Number(piti);

  const auditBreakdown = useMemo(() => {
    if (!Number.isFinite(gallonsValue)) {
      return null;
    }
    const ccf = gallonsValue / 748;
    const expectedMax = (ccf * 17.64) + 41.43;
    return { ccf, expectedMax };
  }, [gallonsValue]);

  const dscrBreakdown = useMemo(() => {
    if (!Number.isFinite(rentValue) || !Number.isFinite(pitiValue) || pitiValue === 0) {
      return null;
    }
    const noi = rentValue * 0.9;
    const dscr = noi / pitiValue;
    return { noi, dscr };
  }, [rentValue, pitiValue]);

  useEffect(() => {
    if (!Number.isFinite(gallonsValue) || !Number.isFinite(billValue)) {
      setAuditResult(null);
      return;
    }
    setAuditResult(SOB_FORENSICS.auditWaterBill(gallonsValue, billValue));
  }, [gallonsValue, billValue]);

  useEffect(() => {
    if (!Number.isFinite(rentValue) || !Number.isFinite(pitiValue) || pitiValue === 0) {
      setDscrResult(null);
      return;
    }
    setDscrResult(SOB_FORENSICS.stressTestDSCR(rentValue, pitiValue));
  }, [rentValue, pitiValue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="border-b border-zinc-200/50 pb-10">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Baltimore Real Estate Forensics</p>
          <h1 className="mt-4 text-6xl font-black tracking-tight text-zinc-900">SOBapp</h1>
          <p className="mt-4 text-xl text-zinc-600">Baltimore Real Estate Forensics Engine</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Enter War Room
            </Link>
            <Link
              href="/deal-shield"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              Test Deal
            </Link>
            <Link
              href="/abatement"
              className="rounded-lg border border-emerald-200 px-6 py-3 text-sm font-semibold text-emerald-600 transition hover:border-emerald-300"
            >
              Generate Abatement Letter
            </Link>
          </div>
        </header>

        <main className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-200/50 bg-white/80 p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-900">DPW Water Bill Audit</h2>
                <p className="mt-2 text-sm text-zinc-600">$17.64 CCF math plus fixed service baseline.</p>
              </div>
              <span className="rounded-full border border-zinc-300 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                Module A
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Total Gallons"
                value={gallons}
                onChange={(event) => setGallons(event.target.value)}
                className="w-full rounded-lg border border-zinc-200/50 bg-white/95 px-4 py-3 text-sm text-zinc-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="Total Bill Amount ($)"
                value={totalBill}
                onChange={(event) => setTotalBill(event.target.value)}
                className="w-full rounded-lg border border-zinc-200/50 bg-white/95 px-4 py-3 text-sm text-zinc-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="rounded-lg border border-zinc-200/50 bg-white/60 px-4 py-3 text-xs text-zinc-600">
                Auto-calculating as you type.
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-200/50 bg-white/80 p-4 text-sm text-zinc-600">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Forensics Logic</p>
              <p className="mt-3 font-mono text-xs text-zinc-600">
                CCF = gallons / 748; expectedMax = (CCF * 17.64) + 41.43
              </p>
              {auditBreakdown && (
                <div className="mt-3 grid gap-2 text-xs text-zinc-600">
                  <p>Computed CCF: {auditBreakdown.ccf.toFixed(2)}</p>
                  <p>Expected Max: ${auditBreakdown.expectedMax.toFixed(2)}</p>
                </div>
              )}
              {auditResult && (
                <div className="mt-4 space-y-2">
                  <p className={auditResult.isValid ? 'text-emerald-600' : 'text-amber-600'}>
                    Status: {auditResult.isValid ? 'Within Expected Range' : 'Over Benchmark'}
                  </p>
                  <p className="text-zinc-600">
                    Discrepancy: ${auditResult.discrepancy.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200/50 bg-white/80 p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-900">DSCR Stress-Test</h2>
                <p className="mt-2 text-sm text-zinc-600">$1.25 lender floor with NOI stress.</p>
              </div>
              <span className="rounded-full border border-zinc-300 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                Module B
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              <input
                type="number"
                inputMode="decimal"
                placeholder="Monthly Rent ($)"
                value={rent}
                onChange={(event) => setRent(event.target.value)}
                className="w-full rounded-lg border border-zinc-200/50 bg-white/95 px-4 py-3 text-sm text-zinc-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <input
                type="number"
                inputMode="decimal"
                placeholder="Monthly Debt Service (PITI)"
                value={piti}
                onChange={(event) => setPiti(event.target.value)}
                className="w-full rounded-lg border border-zinc-200/50 bg-white/95 px-4 py-3 text-sm text-zinc-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="rounded-lg border border-zinc-200/50 bg-white/60 px-4 py-3 text-xs text-zinc-600">
                Auto-calculating as you type.
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-200/50 bg-white/80 p-4 text-sm text-zinc-600">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Forensics Logic</p>
              <p className="mt-3 font-mono text-xs text-zinc-600">
                NOI = rent * 0.90; DSCR = NOI / PITI
              </p>
              {dscrBreakdown && (
                <div className="mt-3 grid gap-2 text-xs text-zinc-600">
                  <p>NOI (90%): ${dscrBreakdown.noi.toFixed(2)}</p>
                  <p>DSCR: {dscrBreakdown.dscr.toFixed(2)}</p>
                </div>
              )}
              {dscrResult && (
                <div className="mt-4 space-y-2">
                  <p className={dscrResult.isFundable ? 'text-emerald-400' : 'text-amber-400'}>
                    Status: {dscrResult.isFundable ? 'Fundable' : 'Below Lender Floor'}
                  </p>
                  <p className="text-zinc-600">DSCR Ratio: {dscrResult.ratio}</p>
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="mt-12 border-t border-zinc-200/50 pt-6 text-xs uppercase tracking-[0.3em] text-zinc-500">
          Powered by SOBapp Intelligence
        </footer>
      </div>
    </div>
  );
}
