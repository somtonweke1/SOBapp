'use client';

import { useEffect, useState } from 'react';

// ─── Types (mirror route.ts) ──────────────────────────────────────────────────
type RiskFlag = {
  agency:       string;
  vendor:       string;
  amount:       number;
  rule:         string;
  citation:     string;
  severity:     'low' | 'medium' | 'high' | 'critical';
  detail:       string;
  sourceUrl:    string;
  contractDate: string;
};

type ScanResult = {
  asOf:            string;
  source:          'live' | 'unavailable';
  flags:           RiskFlag[];
  vendorsImpacted: number;
  totalExposure:   number;
  strictLawShare:  number;
  sourceSummaries: Array<{
    id: string;
    label: string;
    url: string;
    category: 'official' | 'market';
    activityType: 'contracts' | 'awards' | 'low_bidder' | 'solicitations';
    status: 'live' | 'partial' | 'unavailable';
    recordsDetected: number;
    lastUpdatedAt?: string;
    note: string;
  }>;
};

// ─── Severity helpers ─────────────────────────────────────────────────────────
const severityStyles: Record<RiskFlag['severity'], { bar: string; badge: string; text: string }> = {
  critical: { bar: 'bg-red-500',    badge: 'bg-red-500/15 text-red-400 border-red-500/30',    text: 'text-red-400'    },
  high:     { bar: 'bg-amber-500',  badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',  text: 'text-amber-400'  },
  medium:   { bar: 'bg-yellow-500', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', text: 'text-yellow-400' },
  low:      { bar: 'bg-blue-500',   badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',   text: 'text-blue-400'   },
};

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

// ─── Individual flag card ─────────────────────────────────────────────────────
function FlagCard({ flag }: { flag: RiskFlag }) {
  const s = severityStyles[flag.severity];
  return (
    <div className="relative rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      {/* severity stripe */}
      <div className={`absolute inset-y-0 left-0 w-1 ${s.bar}`} />
      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white leading-snug">{flag.rule}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {flag.agency} · <span className="text-slate-400">{flag.vendor}</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-slate-200 font-mono">{fmt$(flag.amount)}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{fmtDate(flag.contractDate)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono tracking-wide ${s.badge}`}>
            {flag.citation}
          </span>
          {flag.sourceUrl && flag.sourceUrl !== '#' && (
            <a
              href={flag.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              Source ↗
            </a>
          )}
        </div>
        <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">{flag.detail}</p>
      </div>
    </div>
  );
}

// ─── Main scanner component ───────────────────────────────────────────────────
export function ProcurementScanner() {
  const [data,    setData]    = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/procurement/scan')
      .then((r) => {
        if (!r.ok) throw new Error(`API error ${r.status}`);
        return r.json();
      })
      .then((d: ScanResult) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {loading ? (
              <span className="h-2 w-2 rounded-full bg-slate-600" />
            ) : data?.source === 'live' ? (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-red-400" />
            )}
            <span className="text-[10px] uppercase tracking-[0.4em] text-slate-500">
              {loading ? 'Loading…' : data?.source === 'live' ? 'Live · Maryland & Baltimore Procurement' : 'Live Source Unavailable'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">Today's Risk Surface</h2>
          {data && (
            <p className="text-[11px] text-slate-600 mt-1">
              Scanned as of {fmtDate(data.asOf)} · COMAR 21 + Baltimore City Charter
            </p>
          )}
          {data?.source === 'unavailable' && (
            <p className="text-[11px] text-red-400/70 mt-1">
              Live data temporarily unavailable — no sample data is shown.
            </p>
          )}
        </div>

        {/* Stats */}
        {data && !loading && (
          <div className="flex gap-6 text-right shrink-0">
            <div>
              <p className="text-2xl font-black font-mono text-white">{data.flags.length}</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Risk Flags</p>
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-white">{data.vendorsImpacted}</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Vendors</p>
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-white">{fmt$(data.totalExposure)}</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Exposure</p>
            </div>
            <div>
              <p className="text-2xl font-black font-mono text-white">{data.strictLawShare}%</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Strict-Law</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {loading && <Skeleton />}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          Scanner unavailable: {error}
        </div>
      )}

      {data && !loading && data.flags.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-8">
          No risk flags found in current procurement data.
        </p>
      )}

      {data && !loading && data.flags.length > 0 && (
        <div className="space-y-3">
          {data.flags.map((flag, i) => (
            <FlagCard key={i} flag={flag} />
          ))}
        </div>
      )}

      {data && !loading && data.sourceSummaries.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Source Coverage</h3>
            <p className="text-[10px] text-slate-600">Official feeds plus market-intelligence layers</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.sourceSummaries.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors hover:border-white/[0.12]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{source.label}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                    source.status === 'live'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : source.status === 'partial'
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                        : 'border-red-500/30 bg-red-500/10 text-red-300'
                  }`}>
                    {source.status}
                  </span>
                </div>
                <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                  {source.category} · {source.activityType.replace('_', ' ')}
                </p>
                <p className="mt-3 text-xs text-slate-400">{source.note}</p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Records</p>
                    <p className="font-mono text-lg font-bold text-white">{source.recordsDetected}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">Updated</p>
                    <p className="text-xs text-slate-400">{source.lastUpdatedAt ? fmtDate(source.lastUpdatedAt) : 'n/a'}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Average challenge score — only show if live */}
      {data?.source === 'live' && data.flags.length > 0 && (
        <p className="mt-4 text-[10px] text-slate-600 text-right">
          Flags sourced from official Maryland/Baltimore feeds plus DGS and Maryland market-intelligence pages.
          Scoring is a decision-support layer, not a legal determination.
        </p>
      )}
    </section>
  );
}
