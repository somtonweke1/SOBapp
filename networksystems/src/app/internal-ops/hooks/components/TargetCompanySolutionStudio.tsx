'use client';

import { useMemo, useState } from 'react';
import type { RiskFlag } from '@/lib/risk/engine';

type TargetCompany = {
  id: string;
  name: string;
  hq: string;
  profile: 'Emerging Multifamily' | 'Distressed Redevelopment' | 'Public-Interface Heavy';
  operationalFocus: string;
  riskFocus: string[];
};

type Props = {
  targets: TargetCompany[];
  liveSignals: RiskFlag[];
};

function scopeFor(profile: TargetCompany['profile']): string[] {
  if (profile === 'Distressed Redevelopment') {
    return [
      'Utility distress and continuity checks around the address (active)',
      'Title, lien, and property-friction review for hidden execution drag (active)',
      'Rehab sequencing sensitivity calculation before capital deployment',
    ];
  }
  if (profile === 'Public-Interface Heavy') {
    return [
      'City-process and public-record friction checks (active)',
      'Procurement and utility adjacency screening as sign layers (active)',
      'Proceed/Caution/Escalate matrix for financing and operator readiness',
    ];
  }
  return [
    'Address-level signal fusion before acquisition lock (active)',
    'Operator and ownership evidence summary (active)',
    'Execution-readiness scoring for small Baltimore deal decisions',
  ];
}

function profileWeight(profile: TargetCompany['profile']): number {
  if (profile === 'Distressed Redevelopment') return 1.2;
  if (profile === 'Public-Interface Heavy') return 1.15;
  return 1.0;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function buildOperationalIndex(target: TargetCompany, signals: RiskFlag[]): number {
  if (signals.length === 0) return 0;
  const avgChallenge = signals.reduce((sum, item) => sum + (item.challengeScore || 0), 0) / signals.length;
  const strictShare =
    signals.filter((item) => item.basis === 'STRICT_LAW').length / Math.max(1, signals.length);
  const base = avgChallenge * 0.7 + strictShare * 100 * 0.3;
  return Math.round(clamp(base * profileWeight(target.profile), 0, 100));
}

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TargetCompanySolutionStudio({ targets, liveSignals }: Props) {
  const [selectedId, setSelectedId] = useState(targets[0]?.id || '');
  const selected = useMemo(() => targets.find((item) => item.id === selectedId) || targets[0], [selectedId, targets]);
  const selectedSignals = useMemo(() => {
    if (!selected) return [];
    return liveSignals.filter((flag) => flag.vendor?.trim() === selected.name);
  }, [selected, liveSignals]);
  const displaySignals = useMemo(() => {
    const source = selectedSignals.length > 0 ? selectedSignals : liveSignals;
    return [...source].sort((a, b) => (b.challengeScore || 0) - (a.challengeScore || 0)).slice(0, 4);
  }, [selectedSignals, liveSignals]);
  const operationalIndex = selected ? buildOperationalIndex(selected, selectedSignals.length > 0 ? selectedSignals : displaySignals) : 0;
  const strictLawShare = selectedSignals.length > 0
    ? selectedSignals.filter((item) => item.basis === 'STRICT_LAW').length / selectedSignals.length
    : 0;
  const exposureTotal = selectedSignals.reduce((sum, item) => sum + (item.exposure || 0), 0);
  const avgChallenge = selectedSignals.length > 0
    ? Math.round(selectedSignals.reduce((sum, item) => sum + (item.challengeScore || 0), 0) / selectedSignals.length)
    : 0;

  if (!selected) return null;

  const exportPacket = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      company: selected.name,
      profile: selected.profile,
      operationalFocus: selected.operationalFocus,
      operationalRiskIndex: operationalIndex,
      scannedSignals: selectedSignals.length,
      strictLawShare,
      averageChallengeScore: avgChallenge,
      totalExposure: exposureTotal,
      scope: scopeFor(selected.profile),
      liveSignals: displaySignals.map((item) => ({
        indicator: item.indicator,
        agency: item.agency,
        vendor: item.vendor,
        citation: item.citation,
        basis: item.basis,
        challengeScore: item.challengeScore || 0,
        exposure: item.exposure,
        sourceUrl: item.sourceUrl,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected.id}-stonebridge-decision-packet.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mt-8 rounded-2xl border border-zinc-200/60 bg-white/95 p-6 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Account Value Workbench</p>
      <h2 className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">Company-Specific Deal Diagnostic Delivery</h2>
      <p className="mt-2 text-sm font-light text-zinc-600">
        Select a named firm and generate a live decision packet from current signals and profile-specific Baltimore deal checks.
      </p>

      <div className="mt-5 grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
          {targets.map((target) => (
            <button
              key={target.id}
              onClick={() => setSelectedId(target.id)}
              className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                target.id === selected.id
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50'
              }`}
            >
              <p className="text-sm font-medium text-zinc-900">{target.name}</p>
              <p className="mt-1 text-xs text-zinc-500">{target.profile} · {target.hq}</p>
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Selected Account</p>
            <p className="mt-1 text-lg font-medium text-zinc-900">{selected.name}</p>
            <p className="text-sm text-zinc-600">{selected.profile} · {selected.hq}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Operational Focus</p>
            <p className="mt-1 text-sm text-zinc-700">{selected.operationalFocus}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Deal Risk Index (Live)</p>
            <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
              <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Risk Index</p>
                <p className="mt-1 text-xl font-medium text-zinc-900">{operationalIndex}/100</p>
              </article>
              <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Signals Scanned</p>
                <p className="mt-1 text-xl font-medium text-zinc-900">{selectedSignals.length}</p>
              </article>
              <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Strict-Law Share</p>
                <p className="mt-1 text-xl font-medium text-zinc-900">{Math.round(strictLawShare * 100)}%</p>
              </article>
              <article className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs text-zinc-500">Exposure</p>
                <p className="mt-1 text-xl font-medium text-zinc-900">{currency(exposureTotal)}</p>
              </article>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Diagnostic Scope (Active Now)</p>
            <ul className="mt-2 space-y-1 text-sm text-zinc-700">
              {scopeFor(selected.profile).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={exportPacket}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Download Diagnostic Packet (JSON)
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/70 p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Live Signals Feeding This Diagnostic Packet</p>
        <div className="mt-3 space-y-2">
          {displaySignals.map((flag) => (
            <article key={flag.id} className="rounded-lg border border-zinc-200 bg-white p-3">
              <p className="text-sm font-medium text-zinc-900">{flag.indicator}</p>
              <p className="mt-1 text-xs text-zinc-600">{flag.agency} · {flag.vendor} · {flag.citation}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
