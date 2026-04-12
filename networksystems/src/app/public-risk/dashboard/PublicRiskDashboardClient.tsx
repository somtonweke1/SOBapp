'use client';

import { useMemo, useState } from 'react';
import type { RiskFlag } from '@/lib/risk/engine';
import { statuteLibrary } from '@/lib/risk/engine';
import VendorRiskScore from '@/components/public-risk/VendorRiskScore';
import RiskHeatmap from '@/components/public-risk/RiskHeatmap';
import TensionHeatmap from '@/components/public-risk/TensionHeatmap';
import ClientErrorBoundary from '@/components/ui/ClientErrorBoundary';
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
  generatedAt: string;
  recordsCount: number;
};

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function loopStatusClass(status: ConstraintLoopStatus): string {
  if (status === 'BRIDGED') return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35';
  if (status === 'BROKEN') return 'bg-red-500/15 text-red-300 border border-red-500/35';
  return 'bg-amber-500/15 text-amber-300 border border-amber-500/35';
}

export default function PublicRiskDashboardClient({ flags, generatedAt, recordsCount }: Props) {
  const [memoGeneratedAt] = useState<string>(() => new Date().toISOString());
  const [jurisdictionFilter, setJurisdictionFilter] = useState<'ALL' | 'Maryland State' | 'Baltimore City'>('ALL');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'STRICT_LAW' | 'RISK_HEURISTIC'>('ALL');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [selectedLoopId, setSelectedLoopId] = useState<string>('');
  const [loopStatuses, setLoopStatuses] = useState<Record<string, ConstraintLoopStatus>>({});
  const [historyBySignature, setHistoryBySignature] = useState<Record<string, number>>({});
  const [completedInterventions, setCompletedInterventions] = useState<BridgeIntervention[]>([]);
  const [deploymentStartedAt, setDeploymentStartedAt] = useState<Record<string, string>>({});
  const [deploying, setDeploying] = useState(false);
  const [deployFeedback, setDeployFeedback] = useState<string>('');

  const safeFlags = useMemo(
    () =>
      (flags || []).map((flag) => ({
        ...flag,
        vendor: String(flag.vendor || 'Unknown Vendor'),
        agency: String(flag.agency || 'Unknown Agency'),
        exposure: Number.isFinite(Number(flag.exposure)) ? Number(flag.exposure) : 0,
      })),
    [flags]
  );

  const filteredFlags = useMemo(
    () =>
      safeFlags.filter((flag) => {
        const jurisdictionOk = jurisdictionFilter === 'ALL' || flag.jurisdiction === jurisdictionFilter;
        const modeOk = modeFilter === 'ALL' || flag.basis === modeFilter;
        const vendorOk = vendorFilter === 'ALL' || flag.vendor === vendorFilter;
        return jurisdictionOk && modeOk && vendorOk;
      }),
    [safeFlags, jurisdictionFilter, modeFilter, vendorFilter]
  );

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
    () => {
      try {
        return buildConstraintLoops(filteredFlags, historyBySignature, loopStatuses);
      } catch (error) {
        console.error('Loop build failed, falling back to empty loop set.', error);
        return [];
      }
    },
    [filteredFlags, historyBySignature, loopStatuses]
  );
  const selectedLoop = useMemo(
    () => loops.find((loop) => loop.id === selectedLoopId) || loops[0] || null,
    [loops, selectedLoopId]
  );
  const selectedBridge = useMemo(
    () => (selectedLoop ? matchBridgeToLoopWithLearning(selectedLoop, learningByType) : null),
    [selectedLoop, learningByType]
  );

  const memoHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set('generatedAt', memoGeneratedAt);
    if (jurisdictionFilter !== 'ALL') params.set('jurisdiction', jurisdictionFilter);
    if (modeFilter !== 'ALL') params.set('mode', modeFilter);
    if (vendorFilter !== 'ALL') params.set('vendor', vendorFilter);
    return `/public-risk/memo?${params.toString()}`;
  }, [memoGeneratedAt, jurisdictionFilter, modeFilter, vendorFilter]);

  const metrics = useMemo(
    () => computeLoopMetrics(loops, completedInterventions),
    [loops, completedInterventions]
  );

  const selectedSignals = selectedLoop?.signals || [];
  const selectedStatute = selectedSignals[0] ? statuteLibrary[selectedSignals[0].citationKey] : null;

  const proposalHref =
    selectedLoop && selectedBridge
      ? `/ops/proposal?company=${encodeURIComponent(selectedLoop.vendor)}&need=invoiceLeakage&annualLeakage=${Math.max(
          50000,
          Math.round(selectedLoop.exposure || 0)
        )}&targetLoopId=${encodeURIComponent(selectedLoop.id)}&bridgeType=${encodeURIComponent(
          selectedBridge.type
        )}&bridgeLane=${encodeURIComponent(selectedBridge.lane)}`
      : '/ops/proposal';
  const proposalPdfHref =
    selectedLoop && selectedBridge
      ? `/api/pdf/generate?company=${encodeURIComponent(selectedLoop.vendor)}&need=invoiceLeakage&annualLeakage=${Math.max(
          50000,
          Math.round(selectedLoop.exposure || 0)
        )}&targetLoopId=${encodeURIComponent(selectedLoop.id)}&bridgeType=${encodeURIComponent(
          selectedBridge.type
        )}&bridgeLane=${encodeURIComponent(selectedBridge.lane)}`
      : '/api/pdf/generate';

  const deployBridge = async () => {
    if (!selectedLoop || !selectedBridge || deploying) return;
    setDeploying(true);
    setDeployFeedback('');
    const startedAt = new Date().toISOString();
    setDeploymentStartedAt((current) => ({ ...current, [selectedLoop.id]: startedAt }));

    try {
      const response = await fetch('/api/public-risk/closure', {
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
    <main className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-sm border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-white">STONEBRIDGE Active Resolution Engine</h1>
            <div className="flex gap-2">
              <a
                href={memoHref}
                target="_blank"
                rel="noreferrer"
                className="rounded-sm border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
              >
                Preview Memo
              </a>
              <a
                href={proposalPdfHref}
                className="rounded-sm bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
              >
                Proposal PDF
              </a>
            </div>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            ConstraintLoop + BridgeIntervention orchestration. Generated {new Date(generatedAt).toLocaleString()} from {recordsCount} records.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Loop Break Rate</div>
              <div className="font-mono text-lg font-semibold text-white">{metrics.loopBreakRate}%</div>
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Time-to-Bridge</div>
              <div className="font-mono text-lg font-semibold text-white">{metrics.timeToBridgeHours}h</div>
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Loops</div>
              <div className="font-mono text-lg font-semibold text-white">{metrics.totalLoops}</div>
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Bridged</div>
              <div className="font-mono text-lg font-semibold text-white">{metrics.bridgedCount}</div>
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Policy Mode</div>
              <select
                className="mt-1 w-full rounded-sm border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as 'ALL' | 'STRICT_LAW' | 'RISK_HEURISTIC')}
              >
                <option value="ALL">All Signals</option>
                <option value="STRICT_LAW">Strict Law</option>
                <option value="RISK_HEURISTIC">Risk Heuristics</option>
              </select>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Jurisdiction</div>
              <select
                className="mt-1 w-full rounded-sm border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                value={jurisdictionFilter}
                onChange={(e) => setJurisdictionFilter(e.target.value as 'ALL' | 'Maryland State' | 'Baltimore City')}
              >
                <option value="ALL">All</option>
                <option value="Maryland State">Maryland State</option>
                <option value="Baltimore City">Baltimore City</option>
              </select>
            </div>
            <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Vendor Filter</div>
              <select
                className="mt-1 w-full rounded-sm border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
              >
                <option value="ALL">All Vendors</option>
                {Array.from(new Set(safeFlags.map((flag) => String(flag.vendor || 'Unknown Vendor')))).slice(0, 80).map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="space-y-4 rounded-sm border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Loop Gallery</h2>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                {loops.length} loops
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {loops.map((loop) => (
                <button
                  key={loop.id}
                  onClick={() => setSelectedLoopId(loop.id)}
                  className={`rounded-sm border p-4 text-left transition-colors ${
                    selectedLoop?.id === loop.id
                      ? 'border-emerald-500/60 bg-emerald-500/5'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-100">{loop.vendor}</p>
                    <span className={`rounded-sm px-2 py-1 text-[11px] font-medium ${loopStatusClass(loop.status)}`}>
                      {loop.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{loop.type.replace('_', ' ')}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
                      <p className="text-slate-500">Tension</p>
                      <p className="font-mono text-slate-100">{loop.tensionScore}</p>
                    </div>
                    <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
                      <p className="text-slate-500">Signals</p>
                      <p className="font-mono text-slate-100">{loop.signals.length}</p>
                    </div>
                    <div className="rounded border border-slate-800 bg-slate-900/60 p-2">
                      <p className="text-slate-500">Exposure</p>
                      <p className="font-mono text-slate-100">{currency(loop.exposure)}</p>
                    </div>
                  </div>
                </button>
              ))}
              {loops.length === 0 && (
                <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">
                  No loops detected under current filters.
                </div>
              )}
            </div>

            <ClientErrorBoundary
              fallback={
                <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                  Tension heatmap temporarily unavailable.
                </div>
              }
            >
              <TensionHeatmap
                loops={loops}
                selectedLoopId={selectedLoop?.id}
                onSelectLoop={(loopId) => setSelectedLoopId(loopId)}
                learningByType={learningByType}
              />
            </ClientErrorBoundary>
            <ClientErrorBoundary
              fallback={
                <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                  Risk heatmap temporarily unavailable.
                </div>
              }
            >
              <RiskHeatmap flags={filteredFlags} />
            </ClientErrorBoundary>
            <ClientErrorBoundary
              fallback={
                <div className="rounded-sm border border-slate-800 bg-slate-950 p-4 text-sm text-slate-400">
                  Vendor risk panel temporarily unavailable.
                </div>
              }
            >
              <VendorRiskScore flags={filteredFlags} onSelectVendor={(vendor) => setVendorFilter(vendor)} />
            </ClientErrorBoundary>
          </section>

          <aside className="space-y-4 rounded-sm border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-lg font-semibold text-white">Bridge Playbook</h2>
            {!selectedLoop || !selectedBridge ? (
              <p className="text-sm text-slate-400">Select a loop to load intervention playbook.</p>
            ) : (
              <>
                <div className="rounded-sm border border-slate-800 bg-slate-950 p-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Selected Loop</p>
                  <p className="mt-1 font-medium text-slate-100">{selectedLoop.vendor}</p>
                  <p className="text-slate-400">{selectedLoop.agency} · {selectedLoop.jurisdiction}</p>
                  <p className="mt-2 text-slate-300">Tension Score: <span className="font-mono">{selectedLoop.tensionScore}</span></p>
                </div>

                <div className="rounded-sm border border-slate-800 bg-slate-950 p-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Intervention Match</p>
                  <p className="mt-1 font-medium text-emerald-300">{selectedBridge.lane} · {selectedBridge.type}</p>
                  <p className="text-slate-300">Expected Delta: {currency(selectedBridge.expectedDelta)}</p>
                </div>

                <div className="rounded-sm border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Playbook Steps</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    {selectedBridge.playbookSteps.map((step) => (
                      <li key={step.id} className="rounded border border-slate-800 bg-slate-900/60 p-2">
                        <p className="font-medium text-slate-100">{step.title}</p>
                        <p className="text-xs text-slate-400">{step.owner} · {step.outcome}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <a
                    href={proposalHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-sm border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
                  >
                    Open Proposal
                  </a>
                  <button
                    onClick={deployBridge}
                    disabled={deploying}
                    className="inline-flex items-center justify-center rounded-sm bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deploying ? 'Deploying...' : 'Deploy Bridge'}
                  </button>
                </div>

                {deployFeedback && (
                  <p className="rounded-sm border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
                    {deployFeedback}
                  </p>
                )}

                {selectedStatute && (
                  <div className="rounded-sm border border-slate-800 bg-slate-950 p-3 text-sm">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Constraint Context</p>
                    <a className="mt-1 block font-medium text-emerald-300 underline" href={selectedStatute.url} target="_blank" rel="noreferrer">
                      {selectedStatute.title}
                    </a>
                    <p className="mt-1 text-slate-300">{selectedStatute.text}</p>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
