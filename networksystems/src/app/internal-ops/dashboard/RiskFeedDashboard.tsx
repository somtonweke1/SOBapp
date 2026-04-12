'use client';

import { useMemo, useState } from 'react';
import type { RiskFlag } from '@/lib/risk/engine';
import { statuteLibrary } from '@/lib/risk/engine';
import type { ScannerInsights } from '@/lib/risk/scanner-insights';
import { evaluateEscalationReadiness } from '@/lib/risk/escalation-readiness';
import type { ClaimValidationResult } from '@/lib/risk/claim-validation';
import {
  buildConstraintLoops,
  computeLoopMetrics,
  matchBridgeToLoopWithLearning,
  type BridgeIntervention,
  type BridgeInterventionType,
  type ConstraintLoop,
  type ConstraintLoopStatus,
} from '@/lib/risk/constraint-loop';

type Props = {
  flags: RiskFlag[];
  scannerStatus?: Record<string, string | null>;
  scannerInsights?: ScannerInsights;
  claimValidations?: ClaimValidationResult[];
};

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function riskTone(flag: RiskFlag): string {
  if (flag.basis === 'STRICT_LAW') return 'text-rose-600 bg-rose-50';
  if (flag.basis === 'RISK_HEURISTIC') return 'text-amber-600 bg-amber-50';
  return 'text-emerald-600 bg-emerald-50';
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'n/a';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return 'n/a';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RiskFeedDashboard({ flags, scannerStatus, scannerInsights, claimValidations = [] }: Props) {
  const [selectedId, setSelectedId] = useState(flags[0]?.id || '');
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(true);
  const [generatedAt] = useState(() => new Date().toISOString());
  const [selectedLoopId, setSelectedLoopId] = useState('');
  const [loopStatuses, setLoopStatuses] = useState<Record<string, ConstraintLoopStatus>>({});
  const [historyBySignature, setHistoryBySignature] = useState<Record<string, number>>({});
  const [completedInterventions, setCompletedInterventions] = useState<BridgeIntervention[]>([]);
  const [deploymentStartedAt, setDeploymentStartedAt] = useState<Record<string, string>>({});
  const [deploying, setDeploying] = useState(false);
  const [deployFeedback, setDeployFeedback] = useState('');

  const selected = useMemo(() => flags.find((f) => f.id === selectedId) || flags[0], [flags, selectedId]);
  const statute = selected ? statuteLibrary[selected.citationKey] : null;
  const scannerSummary = useMemo(() => {
    const raw = scannerStatus?.lastSummary;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { liveRecords?: number };
    } catch {
      return null;
    }
  }, [scannerStatus?.lastSummary]);
  const statusSummary = scannerInsights?.status.lastSummary || scannerSummary;

  const topAgencies = useMemo(() => {
    const totals = new Map<string, number>();
    for (const flag of flags) totals.set(flag.agency, (totals.get(flag.agency) || 0) + flag.exposure);
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([agency, exposure]) => ({ agency, exposure }));
  }, [flags]);
  const learningByType = useMemo(() => {
    const grouped: Partial<Record<BridgeInterventionType, { ratioSum: number; count: number }>> = {};
    for (const item of completedInterventions) {
      if (!item.expectedDelta || !item.actualDelta) continue;
      const current = grouped[item.type] || { ratioSum: 0, count: 0 };
      current.ratioSum += item.actualDelta / item.expectedDelta;
      current.count += 1;
      grouped[item.type] = current;
    }

    return Object.entries(grouped).reduce((acc, [type, value]) => {
      if (!value || value.count === 0) return acc;
      acc[type as BridgeInterventionType] = Number((value.ratioSum / value.count).toFixed(2));
      return acc;
    }, {} as Partial<Record<BridgeInterventionType, number>>);
  }, [completedInterventions]);
  const loops = useMemo(
    () => buildConstraintLoops(flags, historyBySignature, loopStatuses).slice(0, 8),
    [flags, historyBySignature, loopStatuses]
  );
  const selectedLoop = useMemo<ConstraintLoop | null>(
    () => loops.find((loop) => loop.id === selectedLoopId) || loops[0] || null,
    [loops, selectedLoopId]
  );
  const selectedBridge = useMemo(
    () => (selectedLoop ? matchBridgeToLoopWithLearning(selectedLoop, learningByType) : null),
    [selectedLoop, learningByType]
  );
  const loopMetrics = useMemo(
    () => computeLoopMetrics(loops, completedInterventions),
    [loops, completedInterventions]
  );
  const escalationQueue = useMemo(() => {
    const byId = new Map(flags.map((flag) => [flag.id, flag]));
    const validationByFlagId = new Map(claimValidations.map((item) => [item.flagId, item]));
    return evaluateEscalationReadiness(flags, {
      scannerIsStale: scannerInsights?.freshness.isStale,
      claimValidationByFlagId: validationByFlagId,
    })
      .map((readiness) => ({ readiness, flag: byId.get(readiness.flagId) }))
      .filter((item): item is { readiness: ReturnType<typeof evaluateEscalationReadiness>[number]; flag: RiskFlag } => !!item.flag)
      .sort((a, b) => b.readiness.priority - a.readiness.priority);
  }, [flags, scannerInsights?.freshness.isStale, claimValidations]);

  const dossierUrl = useMemo(() => {
    if (!selected) return '/api/pdf/public-risk-memo';
    const params = new URLSearchParams();
    params.set('generatedAt', generatedAt);
    params.set('jurisdiction', selected.jurisdiction);
    params.set('mode', selected.basis);
    params.set('vendor', selected.vendor);
    return `/api/pdf/public-risk-memo?${params.toString()}`;
  }, [selected, generatedAt]);

  const deployBridge = async () => {
    if (!selectedLoop || !selectedBridge || deploying) return;
    setDeploying(true);
    setDeployFeedback('');
    const startedAt = new Date().toISOString();
    setDeploymentStartedAt((current) => ({ ...current, [selectedLoop.id]: startedAt }));

    try {
      const response = await fetch('/api/bridge/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loop: selectedLoop,
          intervention: {
            ...selectedBridge,
            status: 'DEPLOYED',
            deployedAt: startedAt,
          },
        }),
      });

      if (!response.ok) throw new Error('Deploy failed');
      const payload = await response.json();
      const closure = payload?.closure;
      if (!closure) throw new Error('Invalid closure response');

      setLoopStatuses((current) => ({
        ...current,
        [selectedLoop.signature]: 'BRIDGED',
      }));
      setHistoryBySignature((current) => ({
        ...current,
        [selectedLoop.signature]: (current[selectedLoop.signature] || 0) + 1,
      }));
      setCompletedInterventions((current) => [
        {
          ...selectedBridge,
          status: 'COMPLETED',
          actualDelta: closure.actualDelta,
          completedAt: closure.completedAt,
          deployedAt: deploymentStartedAt[selectedLoop.id] || startedAt,
          timeToBridgeHours: closure.timeToBridgeHours,
        },
        ...current,
      ]);
      setDeployFeedback(`Bridge deployed: BRIDGED · realized delta ${currency(closure.actualDelta)}.`);
    } catch (error) {
      console.error(error);
      setDeployFeedback('Bridge deployment failed. Please retry.');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <main className="min-h-screen px-6 pb-12 pt-8 md:px-10">
      <section className="mb-8 rounded-2xl border border-zinc-200/50 bg-white/80 p-8 shadow-sm backdrop-blur-md">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Executive Exposure Heatmap</p>
            <h2 className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">Agency Risk Concentration</h2>
          </div>
          <p className="text-sm font-light text-zinc-500">Updated {new Date(generatedAt).toLocaleString()}</p>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-200/60 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Auto Scanner Status</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-light text-zinc-700">
            <span>
              Last Run:{' '}
              {scannerInsights?.status.lastRunAt
                ? new Date(scannerInsights.status.lastRunAt).toLocaleString()
                : scannerStatus?.lastRunAt
                  ? new Date(scannerStatus.lastRunAt).toLocaleString()
                  : 'Not yet'}
            </span>
            <span>Status: {scannerInsights?.status.lastStatus || scannerStatus?.lastStatus || 'unknown'}</span>
            <span>Total Runs: {scannerInsights?.status.totalRuns || Number(scannerStatus?.totalRuns || '0')}</span>
            <span>Live Procurement Records: {statusSummary?.liveRecords ?? 0}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs uppercase tracking-[0.14em] ${
                scannerInsights?.freshness.isStale ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {scannerInsights?.freshness.isStale ? 'stale' : 'fresh'}
            </span>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">New/Updated Today</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-zinc-900">{scannerInsights?.today.findings ?? 0}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Strict-Law Today</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-rose-600">{scannerInsights?.today.strict ?? 0}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Heuristic Today</p>
            <p className="mt-2 text-3xl font-extralight tracking-tight text-amber-600">{scannerInsights?.today.heuristics ?? 0}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/60 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Daily Exposure</p>
            <p className="mt-2 text-2xl font-extralight tracking-tight text-emerald-600">{currency(scannerInsights?.today.exposure ?? 0)}</p>
          </article>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {topAgencies.map((item) => (
            <article
              key={item.agency}
              className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 backdrop-blur-sm shadow-sm"
            >
              <p className="text-sm font-light text-zinc-500">{item.agency}</p>
              <p className="mt-3 text-3xl font-extralight tracking-tight text-emerald-600">{currency(item.exposure)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Constraint Engine</p>
            <h3 className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">Constraint Loop Gallery</h3>
          </div>
          <a
            href="/public-risk/dashboard"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-light text-white hover:bg-black"
          >
            Open Full Loop Dashboard
          </a>
        </div>
        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <article className="rounded-2xl border border-zinc-200/50 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Loop Break Rate</p>
            <p className="mt-2 text-2xl font-extralight tracking-tight text-zinc-900">{loopMetrics.loopBreakRate}%</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Time-to-Bridge</p>
            <p className="mt-2 text-2xl font-extralight tracking-tight text-zinc-900">{loopMetrics.timeToBridgeHours}h</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Bridged Loops</p>
            <p className="mt-2 text-2xl font-extralight tracking-tight text-zinc-900">{loopMetrics.bridgedCount}</p>
          </article>
          <article className="rounded-2xl border border-zinc-200/50 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Total Loops</p>
            <p className="mt-2 text-2xl font-extralight tracking-tight text-zinc-900">{loopMetrics.totalLoops}</p>
          </article>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {loops.map((loop) => (
            <button
              key={loop.id}
              onClick={() => setSelectedLoopId(loop.id)}
              className={`rounded-xl border bg-zinc-50/70 p-4 text-left ${
                selectedLoop?.id === loop.id ? 'border-emerald-300 bg-emerald-50/60' : 'border-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">{loop.vendor}</p>
                <span className="rounded-md border border-zinc-300 px-2 py-1 text-xs uppercase tracking-[0.12em] text-zinc-600">
                  {loop.status}
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">{loop.type.replace('_', ' ')} · {loop.agency}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-md border border-zinc-200 bg-white p-2">
                  <p className="text-zinc-500">Tension</p>
                  <p className="font-medium text-zinc-900">{loop.tensionScore}</p>
                </div>
                <div className="rounded-md border border-zinc-200 bg-white p-2">
                  <p className="text-zinc-500">Signals</p>
                  <p className="font-medium text-zinc-900">{loop.signals.length}</p>
                </div>
                <div className="rounded-md border border-zinc-200 bg-white p-2">
                  <p className="text-zinc-500">Exposure</p>
                  <p className="font-medium text-zinc-900">{currency(loop.exposure)}</p>
                </div>
              </div>
            </button>
          ))}
          {loops.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              No loops detected yet.
            </div>
          )}
        </div>
        {selectedLoop && selectedBridge && (
          <div className="mt-5 rounded-xl border border-zinc-200 bg-white/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Bridge Playbook</p>
                <p className="mt-1 text-lg font-medium text-zinc-900">{selectedLoop.vendor}</p>
                <p className="text-sm text-zinc-600">
                  {selectedBridge.lane} · {selectedBridge.type} · Expected Delta {currency(selectedBridge.expectedDelta)}
                </p>
              </div>
              <button
                onClick={deployBridge}
                disabled={deploying}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-light text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {deploying ? 'Deploying...' : 'Deploy Bridge'}
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              {selectedBridge.playbookSteps.map((step) => (
                <li key={step.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                  <p className="font-medium text-zinc-900">{step.title}</p>
                  <p className="text-xs text-zinc-600">{step.owner} · {step.outcome}</p>
                </li>
              ))}
            </ul>
            {deployFeedback && (
              <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">{deployFeedback}</p>
            )}
          </div>
        )}
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Embedded Tool</p>
            <h3 className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">Procurement Scanner</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setScannerOpen((prev) => !prev)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-light text-zinc-700 hover:bg-zinc-50"
            >
              {scannerOpen ? 'Hide' : 'Show'} Scanner
            </button>
            <a
              href="/procurement-scanner"
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-light text-white hover:bg-black"
            >
              Open Full Page
            </a>
          </div>
        </div>

        {scannerOpen ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white">
            <iframe
              src="/procurement-scanner"
              title="Procurement Scanner"
              className="h-[820px] w-full"
            />
          </div>
        ) : null}
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-lg">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Persisted Findings</p>
            <h3 className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">Daily DB Update Feed</h3>
          </div>
          <div className="text-sm font-light text-zinc-600">
            Latest DB write:{' '}
            {scannerInsights?.freshness.latestFindingAt
              ? `${new Date(scannerInsights.freshness.latestFindingAt).toLocaleString()} (${relativeTime(scannerInsights.freshness.latestFindingAt)})`
              : 'n/a'}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/70">
            <div className="border-b border-zinc-200/60 px-5 py-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
              Recent Findings (Persisted)
            </div>
            <div className="max-h-80 overflow-y-auto">
              {(scannerInsights?.recentFindings || []).map((item) => (
                <article key={item.snapshotId} className="border-b border-zinc-200/50 px-5 py-4">
                  <p className="text-sm font-medium text-zinc-900">{item.indicator}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {item.agencyName} · {item.vendorName}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(item.generatedAt).toLocaleString()} ({relativeTime(item.generatedAt)}) · {item.basis}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">7-Day Trend</p>
            <div className="mt-4 space-y-2">
              {(scannerInsights?.dailyTrend || []).map((point) => (
                <div key={point.day} className="grid grid-cols-[0.8fr_0.4fr_0.8fr] items-center gap-3 text-sm">
                  <span className="text-zinc-600">{point.day}</span>
                  <span className="font-medium text-zinc-900">{point.findings}</span>
                  <span className="text-right text-emerald-700">{currency(point.exposure)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/50 bg-white/95 p-8 shadow-xl backdrop-blur-md">
        <div className="mb-8 rounded-2xl border border-zinc-200/50 bg-zinc-50/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Escalation Validator</p>
              <h3 className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">Ready-To-Escalate Queue</h3>
            </div>
            <div className="text-sm text-zinc-600">
              {escalationQueue.filter((item) => item.readiness.ready).length} ready / {escalationQueue.length} total
            </div>
          </div>
          <div className="space-y-3">
            {escalationQueue.slice(0, 8).map(({ readiness, flag }) => (
              <article key={flag.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{flag.indicator}</p>
                    <p className="mt-1 text-xs text-zinc-600">{flag.agency} · {flag.vendor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-zinc-900">Readiness {readiness.score}%</p>
                    <span className={`mt-1 inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                      readiness.recommendedAction === 'ESCALATE_NOW'
                        ? 'bg-emerald-100 text-emerald-700'
                        : readiness.recommendedAction === 'REVIEW_FIRST'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-zinc-200 text-zinc-700'
                    }`}>
                      {readiness.recommendedAction.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-500">Primary contacts: {readiness.contacts.slice(0, 2).join(' | ')}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Correspondence: {readiness.checks.find((check) => check.key === 'claim_correspondence')?.status || 'WARN'}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Risk Feed</p>
            <h3 className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">Live Record Feed</h3>
          </div>
          <div className="rounded-lg border border-zinc-200/60 bg-white px-3 py-2 text-sm font-light text-zinc-600">
            {flags.length} active indicators
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/70">
          <div className="grid grid-cols-[1.2fr_1fr_0.6fr_0.5fr] border-b border-zinc-200/60 px-6 py-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
            <span>Finding</span>
            <span>Agency / Vendor</span>
            <span>Exposure</span>
            <span>Signal</span>
          </div>

          <div className="max-h-[64vh] overflow-y-auto">
            {flags.map((flag, index) => (
              <button
                key={flag.id}
                onClick={() => {
                  setSelectedId(flag.id);
                  setExplorerOpen(true);
                }}
                className={`grid w-full grid-cols-[1.2fr_1fr_0.6fr_0.5fr] items-center gap-4 border-b border-zinc-200/50 px-6 py-5 text-left transition-colors hover:bg-zinc-50/50 ${
                  index % 2 === 0 ? 'bg-white/70' : 'bg-zinc-50/40'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-light text-zinc-900">{flag.indicator}</p>
                  <p className="mt-1 text-xs font-light text-zinc-500">{flag.citation}</p>
                </div>
                <div>
                  <p className="text-sm font-light text-zinc-800">{flag.agency}</p>
                  <p className="text-sm font-medium text-zinc-600">{flag.vendor}</p>
                </div>
                <p className="text-lg font-medium tracking-tight text-zinc-900">{currency(flag.exposure)}</p>
                <span
                  className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] ${riskTone(flag)}`}
                >
                  {flag.basis === 'STRICT_LAW' ? 'Strict' : 'Heuristic'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {explorerOpen && selected && statute && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/20 backdrop-blur-[1px]">
          <div className="h-full w-full max-w-xl border-l border-zinc-200/60 bg-white/95 p-8 shadow-xl backdrop-blur-md">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Statute Explorer</p>
                <h4 className="mt-2 text-2xl font-extralight tracking-tight text-zinc-900">Legal Context Panel</h4>
              </div>
              <button
                onClick={() => setExplorerOpen(false)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-light text-zinc-600 hover:bg-zinc-50"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 rounded-2xl border border-zinc-200/50 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Citation</p>
                <a href={statute.url} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-medium text-emerald-700 underline">
                  {statute.title}
                </a>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Rule Text</p>
                <p className="mt-1 text-sm font-light text-zinc-700">{statute.text}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-zinc-200/60 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Exposure</p>
                  <p className="mt-2 text-xl font-medium text-zinc-900">{currency(selected.exposure)}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200/60 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Confidence</p>
                  <p className="mt-2 text-xl font-medium text-zinc-900">{Math.round(selected.confidence * 100)}%</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Defensibility</p>
                <p className="mt-1 text-sm font-medium text-zinc-800">
                  {selected.challengeScore ?? 0}% {selected.challengeDisposition || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Snapshot Timestamp</p>
                <p className="mt-1 text-sm font-light text-zinc-700">{generatedAt}</p>
              </div>

              <a
                href={dossierUrl}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-light text-white transition-colors hover:bg-emerald-700"
              >
                Generate Dossier
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
