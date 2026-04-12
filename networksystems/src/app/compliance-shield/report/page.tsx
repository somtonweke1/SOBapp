'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import StoneBridgeShell from '@/components/stonebridge/shell/StoneBridgeShell';
import ProcessPanel from '@/components/stonebridge/shell/ProcessPanel';

function money(value: number) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function ComplianceShieldReportPage() {
  const [generating, setGenerating] = useState(false);

  const report = useMemo(() => {
    return {
      jurisdiction: 'Baltimore, MD',
      corridor: '21201 / 21202',
      riskScore: 7.1,
      exposureBand: 'Moderate-High',
      estimatedDueDiligence: 18500,
      focusSignals: [
        'Historic medical/dental use flags',
        'Environmental permit adjacency',
        'Waste stream liability (mercury / sharps / chemicals)',
        'Lender sensitivity to unresolved environmental narratives',
      ],
      recommendedActions: [
        'Initiate Phase I ESA trigger check and chain-of-title scan',
        'Collect manifests / CODs (Certificates of Destruction) for regulated waste',
        'Engage Maryland VCP pathway assessment (if relevant)',
        'Draft an audit-ready packet for lender underwriting and dispute resolution',
      ],
    };
  }, []);

  const handleDownload = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      window.print();
    }, 350);
  };

  return (
    <StoneBridgeShell
      activeMode="compliance"
      title="Environmental Risk Packet"
      subtitle="Audit-ready trail for faster dispute resolution and lender comfort."
      primaryAction={
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          {generating ? 'Preparing...' : 'Download / Print'}
        </button>
      }
      secondaryAction={
        <Link
          href="/compliance-shield"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 shadow-sm transition-colors hover:bg-white"
        >
          Back
        </Link>
      }
      aside={
        <ProcessPanel
          steps={[
            'Collect corridor context and exposure signals.',
            'Generate a lender/counsel-friendly packet.',
            'Use the packet to de-risk acquisition or lease-up.',
          ]}
          bullets={[
            'Clear risk score + recommended actions.',
            'Focus on proof, not dashboards.',
            'Printable, shareable, audit-ready.',
          ]}
        />
      }
    >
      <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200/50 bg-white/80 p-4">
            <div className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Corridor</div>
            <div className="mt-2 text-lg font-light text-zinc-900">{report.corridor}</div>
            <div className="mt-1 text-sm font-light text-zinc-600">{report.jurisdiction}</div>
          </div>
          <div className="rounded-xl border border-zinc-200/50 bg-white/80 p-4">
            <div className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Risk Score</div>
            <div className="mt-2 text-lg font-light text-zinc-900">{report.riskScore.toFixed(1)} / 10</div>
            <div className="mt-1 text-sm font-light text-zinc-600">{report.exposureBand}</div>
          </div>
          <div className="rounded-xl border border-zinc-200/50 bg-white/80 p-4">
            <div className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Due Diligence Budget</div>
            <div className="mt-2 text-lg font-light text-zinc-900">{money(report.estimatedDueDiligence)}</div>
            <div className="mt-1 text-sm font-light text-zinc-600">Phase I/II + packet</div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-5">
            <div className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Primary Signals</div>
            <ul className="mt-3 space-y-2 text-sm font-light text-zinc-700">
              {report.focusSignals.map((s) => (
                <li key={s} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-200/50 bg-white/80 p-5">
            <div className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Recommended Actions</div>
            <ol className="mt-3 space-y-2 text-sm font-light text-zinc-700">
              {report.recommendedActions.map((a, idx) => (
                <li key={a} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs text-zinc-600">
                    {idx + 1}
                  </span>
                  <span>{a}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </StoneBridgeShell>
  );
}
