'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import WarRoomMap from '@/components/war-room/war-room-map';
import WarRoomFeed from '@/components/war-room/war-room-feed';
import WarRoomPipeline from '@/components/war-room/war-room-pipeline';
import WarRoomSnapshot from '@/components/war-room/war-room-snapshot';

export default function DashboardPage() {
  const { data: session } = useSession();
  const isSubscribed = Boolean(session?.user?.isSubscribed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-6 border-b border-zinc-200/50 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">SOBapp War Room</p>
            <h1 className="mt-4 text-4xl font-semibold text-zinc-900">Baltimore Property Distress Map</h1>
            <p className="mt-3 text-zinc-600">
              Live intelligence on DPW anomalies, lien filings, and infrastructure risk clusters.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Start Audit
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

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">3D Network Overview</h2>
                <p className="text-sm text-zinc-600">Nodes = properties. Links = ownership / infrastructure ties.</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs uppercase tracking-[0.3em] text-blue-700">
                Live
              </span>
            </div>
            <div className="relative mt-6 h-[420px] overflow-hidden rounded-xl border border-zinc-200/50">
              <div className={isSubscribed ? '' : 'blur-sm'}>
                <WarRoomMap />
              </div>
              {!isSubscribed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 text-center">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Locked</p>
                  <h3 className="mt-2 text-2xl font-semibold text-zinc-900">Unlock the War Room</h3>
                  <p className="mt-2 max-w-sm text-sm text-zinc-600">
                    Members get full 3D infrastructure mapping, forensic alerts, and abatement exports.
                  </p>
                  <Link
                    href="/auth/signup"
                    className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700"
                  >
                    $18 to Unlock
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <WarRoomFeed />
            <WarRoomPipeline />
            <WarRoomSnapshot />
          </div>
        </div>
      </div>
    </div>
  );
}
