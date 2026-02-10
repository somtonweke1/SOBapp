'use client';

import Link from 'next/link';

export default function PublicPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-400">
          SOBapp
        </div>
        <h1 className="mt-6 text-5xl font-black tracking-tight text-white">
          Baltimore Real Estate Forensics
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-300">
          Audit DPW water bills, stress-test DSCR, and surface property distress signals built for Baltimore investors.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            Launch Audit Engine
          </Link>
          <Link
            href="/deal-shield"
            className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
          >
            View Deal Shield
          </Link>
        </div>
      </div>
    </div>
  );
}
