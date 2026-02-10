'use client';

import Link from 'next/link';

export default function PublicPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.35em] text-zinc-500">
          SOBapp
        </div>
        <h1 className="mt-6 text-5xl font-extralight tracking-tight text-zinc-900">
          Baltimore Real Estate Forensics
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600 font-light">
          Audit DPW water bills, stress-test DSCR, and surface property distress signals built for Baltimore investors.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Launch Audit Engine
          </Link>
          <Link
            href="/deal-shield"
            className="rounded-lg border border-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:text-zinc-900"
          >
            View Deal Shield
          </Link>
        </div>
      </div>
    </div>
  );
}
