'use client';

import Link from 'next/link';

export default function ClaimsPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-emerald-100 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-8">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">CLAIMS TERMINAL</p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-extralight tracking-tight">
                CLAIMS_INTAKE: ACTIVE
              </h1>
              <p className="mt-4 text-base text-emerald-200/80">
                CONTINGENCY MODEL ENABLED. DATA CAPTURE READY.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Claim Coverage</p>
              <ul className="mt-6 space-y-4 text-sm text-emerald-200/80">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>3D Infrastructure Mapping with environmental permit overlays.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>Abatement Letter Suite with DPW dispute templates and evidence packs.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>Logistics spread tracking for healthcare tenants and clinics.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-6 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Contingency Terms</p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs text-emerald-200/80">
                <span className="rounded-full border border-emerald-400/40 px-3 py-1">30% Success Fee Only</span>
                <span className="rounded-full border border-emerald-400/40 px-3 py-1">24/7 Forensic Support</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-8 shadow-2xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Claims Intake</p>
            <h2 className="mt-4 text-3xl font-semibold">Start Free Forensic Audit</h2>
            <p className="mt-3 text-sm text-emerald-200/80">
              ZERO SUBSCRIPTION. RECOVERY SPLIT ONLY.
            </p>

            <Link
              href="/audit"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-100 shadow-[0_0_24px_rgba(0,255,65,0.35)] transition hover:bg-emerald-500/20"
            >
              RUN AUDIT
            </Link>

            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 text-xs text-emerald-200/80">
              <p className="uppercase tracking-[0.3em] text-emerald-400">Included</p>
              <ul className="mt-3 space-y-2">
                <li>Instant DPW forensic scans</li>
                <li>Recovery claim packaging</li>
                <li>Environmental permit alerts</li>
              </ul>
            </div>

            <p className="mt-6 text-center text-xs text-emerald-200/70">
              Already have a claim?{' '}
              <Link href="/auth/signin" className="text-emerald-300 hover:text-emerald-200">
                Sign in here
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
