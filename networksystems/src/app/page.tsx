'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import ThreeDNetworkMap from '@/components/visualization/3d-network-map';

export default function SOBLandingPage() {
  const [query, setQuery] = useState('');
  const [billAmount, setBillAmount] = useState('');

  const billValue = Number(billAmount);
  const estimatedRecovery = useMemo(() => {
    if (!Number.isFinite(billValue) || billValue <= 0) return null;
    return billValue * 0.18;
  }, [billValue]);

  const normalizedQuery = query.trim();
  const isZip = /^\d{5}$/.test(normalizedQuery);
  const strikeSummary = useMemo(() => {
    // Fast, deterministic “aha” moment while we wire real data to the landing.
    if (!normalizedQuery) return null;

    const base = isZip
      ? { label: `Strike Zone ${normalizedQuery}`, scope: 'ZIP' as const }
      : { label: normalizedQuery, scope: 'ADDRESS_OR_LANDMARK' as const };

    // Make 21201 feel “real” instantly; keep others plausible but conservative.
    if (normalizedQuery === '21201') {
      return {
        ...base,
        risk: 'Warning' as const,
        highPriority: 12,
        openSignals: 47,
        avgOvercharge: 342,
        note: 'Downtown corridor shows repeat billing anomalies and unresolved service signals.',
      };
    }

    return {
      ...base,
      risk: 'Stable' as const,
      highPriority: isZip ? 6 : 3,
      openSignals: isZip ? 22 : 9,
      avgOvercharge: 285,
      note: 'Initial scan ready. Run a full audit to lock evidence and generate a report.',
    };
  }, [isZip, normalizedQuery]);

  const riskBadge = (risk: 'Stable' | 'Warning' | 'Immediate Risk') => {
    if (risk === 'Immediate Risk') return { label: 'Immediate Risk', cls: 'bg-rose-500/15 text-rose-200 border-rose-400/40' };
    if (risk === 'Warning') return { label: 'Warning', cls: 'bg-amber-500/15 text-amber-200 border-amber-400/40' };
    return { label: 'Stable', cls: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/40' };
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    // For now, route to the most “hands-on” flow. We'll evolve this into a dedicated /map/search view.
    const q = normalizedQuery;
    if (!q) return;
    const params = new URLSearchParams();
    params.set(isZip ? 'zip' : 'q', q);
    window.location.href = `/claims?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-emerald-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="border-b border-white/10 pb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/90">Sons of Baltimore Forensics</p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-emerald-50">
                Protecting Baltimore’s infrastructure, one address at a time.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-emerald-200/80">
                Enter an address, ZIP code, or landmark. Get a fast strike summary, then generate a shareable forensic audit.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:bg-emerald-500/20"
                >
                  Sign In
                </Link>
                <Link
                  href="/ops/proposal"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/90 transition hover:bg-white/10"
                >
                  View Sample Audit
                </Link>
              </div>
            </div>

            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/90">30-Second Walkthrough</p>
              <div className="mt-3 rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-black/40 to-black/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-9 w-9 rounded-xl border border-emerald-400/30 bg-emerald-500/10 grid place-items-center">
                    <span className="text-sm font-semibold text-emerald-100">1</span>
                  </div>
                  <div className="text-sm text-emerald-100/90">
                    Search a location
                    <div className="text-xs text-emerald-200/70">Address, ZIP, or landmark.</div>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <div className="mt-1 h-9 w-9 rounded-xl border border-emerald-400/30 bg-emerald-500/10 grid place-items-center">
                    <span className="text-sm font-semibold text-emerald-100">2</span>
                  </div>
                  <div className="text-sm text-emerald-100/90">
                    Review the strike summary
                    <div className="text-xs text-emerald-200/70">Plain-English risk labels with evidence trails.</div>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-3">
                  <div className="mt-1 h-9 w-9 rounded-xl border border-emerald-400/30 bg-emerald-500/10 grid place-items-center">
                    <span className="text-sm font-semibold text-emerald-100">3</span>
                  </div>
                  <div className="text-sm text-emerald-100/90">
                    Download a forensic audit
                    <div className="text-xs text-emerald-200/70">A PDF artifact you can share in seconds.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-10">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-2xl backdrop-blur">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/90">Smart Search</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Try: 21201, “Lexington Market”, or “Saratoga Center”"
                  className="w-full flex-1 rounded-2xl border border-emerald-400/25 bg-black/40 px-4 py-3 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                />
                <button
                  type="submit"
                  className="rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-500/25"
                >
                  Run Quick Scan
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {['21201', 'Lexington Market', 'Saratoga Center'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setQuery(chip)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-emerald-100/90 hover:bg-white/10"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {strikeSummary && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-emerald-50">{strikeSummary.label}</div>
                      <div className="mt-1 text-xs text-emerald-200/70">
                        Quick scan ({strikeSummary.scope === 'ZIP' ? 'ZIP strike zone' : 'target'}). Full audit available.
                      </div>
                    </div>
                    <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${riskBadge(strikeSummary.risk).cls}`}>
                      {riskBadge(strikeSummary.risk).label}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-emerald-200/60">High Priority</div>
                      <div className="mt-2 text-2xl font-semibold text-emerald-50">{strikeSummary.highPriority}</div>
                      <div className="mt-1 text-xs text-emerald-200/70">Abatement opportunities flagged.</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-emerald-200/60">Open Signals</div>
                      <div className="mt-2 text-2xl font-semibold text-emerald-50">{strikeSummary.openSignals}</div>
                      <div className="mt-1 text-xs text-emerald-200/70">Unresolved service indicators.</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-emerald-200/60">Avg Overcharge</div>
                      <div className="mt-2 text-2xl font-semibold text-emerald-50">${strikeSummary.avgOvercharge}</div>
                      <div className="mt-1 text-xs text-emerald-200/70">Estimated billing drift.</div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-emerald-100/80">{strikeSummary.note}</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/ops/proposal${normalizedQuery ? `?address=${encodeURIComponent(normalizedQuery)}` : ''}`}
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/90 transition hover:bg-white/10"
                    >
                      View Audit Artifact
                    </Link>
                    <Link
                      href={`/claims${normalizedQuery ? `?${isZip ? `zip=${encodeURIComponent(normalizedQuery)}` : `q=${encodeURIComponent(normalizedQuery)}`}` : ''}`}
                      className="inline-flex items-center justify-center rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-50 transition hover:bg-emerald-500/25"
                    >
                      Start Full Audit
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </form>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-8 shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/90">Quick Estimator</p>
            <h2 className="mt-3 text-2xl font-semibold text-emerald-50">DPW Recovery Estimate</h2>
            <p className="mt-2 text-sm text-emerald-200/80">Put a bill amount in. Get a rough recovery range.</p>
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
                Start Audit
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-8 shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/90">Status</p>
            <h3 className="mt-3 text-lg font-semibold text-emerald-50">What You Get</h3>
            <p className="mt-2 text-sm text-emerald-200/80">
              A readable risk label, the evidence trail, and a PDF artifact for stakeholders.
            </p>
            <div className="mt-6 space-y-4 text-sm text-emerald-200/80">
              <div className="flex items-center justify-between">
                <span>Risk Labels</span>
                <span className="text-emerald-200 font-semibold">Stable / Warning / Immediate</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Evidence Trail</span>
                <span className="text-emerald-200 font-semibold">Address-level</span>
              </div>
              <div className="flex items-center justify-between">
                <span>PDF Artifact</span>
                <span className="text-emerald-200 font-semibold">1-click export</span>
              </div>
            </div>
            <div className="mt-6">
              <Link
                href="/ops/proposal"
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
              >
                Open Sample Audit
              </Link>
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
              <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/90">3D Forensic Map</p>
              <h2 className="mt-3 text-3xl font-semibold text-emerald-50">See risk as a network, not a spreadsheet.</h2>
              <p className="mt-3 max-w-2xl text-sm text-emerald-200/80">
                The map is designed for briefings: simple labels up front, deep evidence when you need it.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: 'Readable First',
                    description: 'Status badges and plain-English summaries before the deep dive.'
                  },
                  {
                    title: 'Evidence Locked',
                    description: 'Exportable audit artifacts for owners, partners, and counsel.'
                  },
                  {
                    title: 'Forensic Depth',
                    description: 'Full trail stays available for specialists without overwhelming everyone.'
                  }
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5 text-sm text-emerald-200/80 shadow-lg"
                  >
                    <h3 className="text-base font-semibold text-emerald-50">{card.title}</h3>
                    <p className="mt-2 font-light">{card.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/claims"
                  className="inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100 shadow-[0_0_18px_rgba(0,255,65,0.35)] transition hover:bg-emerald-500/20"
                >
                  Open The Audit Flow
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
