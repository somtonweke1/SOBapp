'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import WarRoomMap from '@/components/war-room/war-room-map';
import WarRoomFeed from '@/components/war-room/war-room-feed';
import WarRoomPipeline from '@/components/war-room/war-room-pipeline';
import WarRoomSnapshot from '@/components/war-room/war-room-snapshot';

export const dynamic = 'force-dynamic';

function DashboardInner() {
  const { data: session } = useSession();
  const userRole = (session?.user?.userRole || 'LANDLORD') as 'LANDLORD' | 'TENANT';
  const searchParams = useSearchParams();
  const fromSuccess = searchParams.get('from') === 'success';
  const [showWelcome, setShowWelcome] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    if (!fromSuccess) return;
    setShowWelcome(true);
    setIsRevealing(true);
    const revealTimer = setTimeout(() => setIsRevealing(false), 1200);
    const toastTimer = setTimeout(() => setShowWelcome(false), 4500);
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(toastTimer);
    };
  }, [fromSuccess]);

  const recoveryData = useMemo(() => {
    return {
      identified: 84250,
      recovered: 31240,
    };
  }, []);

  const recoveryTicker = useMemo(() => {
    return [
      'Recovered $1.24M across Baltimore',
      '58 active DPW recovery claims',
      'Average overcharge: $3,210',
      'Next CSSD hearing window in 12 days',
      'DPW audit queue steady at 128'
    ];
  }, []);

  const logisticsZip = useMemo(() => {
    return userRole === 'TENANT' ? '21217' : '21201';
  }, [userRole]);

  const ledgerEntries = useMemo(() => {
    return [
      {
        id: 'SOB-2026-4182',
        property: '1507 Laurens St',
        owner: 'L. Johnson',
        recovered: 8420,
        status: 'unpaid' as const,
        account: 'DPW-77102'
      },
      {
        id: 'SOB-2026-4875',
        property: '2121 N Broadway',
        owner: 'Northwood LLC',
        recovered: 12650,
        status: 'processing' as const,
        account: 'DPW-88410'
      },
      {
        id: 'SOB-2026-5029',
        property: '801 W Fayette St',
        owner: 'Fayette Holdings',
        recovered: 19400,
        status: 'settled' as const,
        account: 'DPW-66319'
      }
    ];
  }, []);

  const handleDownloadInvoice = async (entry: typeof ledgerEntries[number]) => {
    const response = await fetch('/api/generate-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerName: entry.owner,
        propertyAddress: entry.property,
        dpwAccountNumber: entry.account,
        grossDisputedAmount: entry.recovered * 1.35,
        recoveredAmount: entry.recovered,
        evidenceUrl: `https://sobapp.vercel.app/dashboard?case=${entry.id}`,
      }),
    });

    if (!response.ok) {
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recovery-invoice-${entry.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-emerald-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {showWelcome && (
          <div className="fixed top-6 right-6 z-50 rounded-2xl border border-emerald-200/60 bg-white/95 px-5 py-3 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">War Room Unlocked</p>
            <p className="mt-2 text-sm text-zinc-700">Welcome to the front lines.</p>
          </div>
        )}
        <header className="flex flex-col gap-6 border-b border-zinc-200/50 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">WAR_ROOM</p>
            <h1 className="mt-4 text-4xl font-semibold text-emerald-100">NODE_MONITORING: ACTIVE</h1>
            <p className="mt-3 text-emerald-200/80">
              CAPITAL_LEAK_DETECTION: RUNNING
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/claims"
              className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
            >
              CLAIMS_INTAKE: READY
            </Link>
            <Link
              href="/deal-shield"
              className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              Test Deal
            </Link>
            <Link
              href="/abatement"
              className="rounded-lg border border-emerald-200 px-5 py-2 text-sm font-semibold text-emerald-600 transition hover:border-emerald-300"
            >
              Premium Export
            </Link>
          </div>
        </header>

        <div className="mt-6 overflow-hidden rounded-3xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-emerald-400">
            <span>Recovery Ticker</span>
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-3 overflow-hidden">
            <div className="flex w-[200%] gap-8 sob-ticker text-sm text-emerald-200/80">
              {[...recoveryTicker, ...recoveryTicker].map((item, index) => (
                <span key={`${item}-${index}`} className="whitespace-nowrap font-forensic">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-emerald-100">Environmental Risk Map</h2>
                <p className="text-sm text-emerald-200/80">Amber glow = historical medical permits detected.</p>
              </div>
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200">
                Live
              </span>
            </div>
            <div className="relative mt-6 h-[420px] overflow-hidden rounded-xl border border-emerald-400/20">
              <div className={`${isRevealing ? 'blur-md transition-all duration-1000' : ''}`}>
                <WarRoomMap />
              </div>
              <div className="absolute right-4 top-4 rounded-full border border-emerald-400/40 bg-black/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-200 shadow-md">
                <span className="mr-2 inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                DPW API Live Signal
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Capital Recovery Tracker</p>
                  <h3 className="mt-2 text-lg font-semibold text-emerald-100">Identified vs. Recovered</h3>
                </div>
                <span className="text-xs font-semibold text-emerald-300">DPW Overcharge Pipeline</span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  { label: 'Identified Overcharges', value: recoveryData.identified, color: 'bg-amber-500' },
                  { label: 'Recovered Cash', value: recoveryData.recovered, color: 'bg-emerald-500' },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between text-xs text-emerald-200/70">
                      <span>{bar.label}</span>
                      <span className="font-semibold text-emerald-100 font-forensic">${bar.value.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 h-3 w-full rounded-full bg-emerald-900/40">
                      <div
                        className={`h-3 rounded-full ${bar.color}`}
                        style={{
                          width: `${Math.min(100, (bar.value / recoveryData.identified) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-2xl backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Logistics Optimization</p>
              <h3 className="mt-2 text-lg font-semibold text-emerald-100">Healthcare Route Density</h3>
              {userRole === 'TENANT' ? (
                <div className="mt-5 space-y-4 text-sm text-emerald-200/80">
                  <div className="flex items-center justify-between">
                    <span>Status: Route Density at 60%</span>
                    <span className="font-semibold text-amber-400 font-forensic">60%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-emerald-900/40">
                    <div
                      className="h-3 rounded-full bg-amber-500"
                      style={{ width: `60%` }}
                    />
                  </div>
                  <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
                    Join 4 more neighbors in zip {logisticsZip} to unlock wholesale Clean Harbors rates.
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:bg-emerald-500/20"
                  >
                    Request Clean Harbors Pickup
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-emerald-200/70">
                  Switch to Healthcare Tenant mode to activate route density incentives.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Recovery Ledger</p>
                  <h3 className="mt-2 text-lg font-semibold text-emerald-100">Successful Abatements</h3>
                </div>
                <span className="text-xs font-semibold text-emerald-300">Collections</span>
              </div>
              <div className="mt-5 space-y-3 text-sm text-emerald-200/80">
                {ledgerEntries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">{entry.id}</p>
                        <p className="mt-1 font-semibold text-emerald-100">{entry.property}</p>
                        <p className="text-xs text-emerald-200/70">Owner: {entry.owner}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Recovered</p>
                        <p className="mt-1 font-semibold text-emerald-100 font-forensic">
                          ${entry.recovered.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] ${
                          entry.status === 'unpaid'
                            ? 'border-rose-400/40 bg-rose-500/20 text-rose-300 animate-pulse'
                            : entry.status === 'processing'
                              ? 'border-amber-400/40 bg-amber-500/20 text-amber-300'
                              : 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {entry.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(entry)}
                        className="rounded-lg border border-emerald-400/40 bg-black/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-200 transition hover:border-emerald-400/70"
                      >
                        Download Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <WarRoomFeed />
            <WarRoomPipeline />
            <WarRoomSnapshot />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <DashboardInner />
    </Suspense>
  );
}
