'use client';

import { useMemo, useState } from 'react';
import {
  matchBridgeToLoopWithLearning,
  type BridgeInterventionType,
  type ConstraintLoop,
} from '@/lib/risk/constraint-loop';

type Props = {
  loops: ConstraintLoop[];
  selectedLoopId?: string;
  onSelectLoop?: (loopId: string) => void;
  learningByType?: Partial<Record<BridgeInterventionType, number>>;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function complexity(loop: ConstraintLoop): number {
  const severityWeight = loop.signals.reduce((sum, signal) => {
    if (signal.severity === 'HIGH') return sum + 3;
    if (signal.severity === 'MEDIUM') return sum + 2;
    return sum + 1;
  }, 0);
  return Math.max(1, Math.min(100, Math.round(severityWeight * 5 + loop.signals.length * 4)));
}

function impact(loop: ConstraintLoop): number {
  if (loop.exposure <= 0) return 1;
  return Math.max(1, Math.min(100, Math.round(Math.log10(loop.exposure + 1) * 18)));
}

export default function TensionHeatmap({
  loops,
  selectedLoopId,
  onSelectLoop,
  learningByType = {},
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const normalized = useMemo(
    () =>
      loops.map((loop) => ({
        loop,
        complexity: complexity(loop),
        impact: impact(loop),
        recommendation: matchBridgeToLoopWithLearning(loop, learningByType),
      })),
    [loops, learningByType]
  );
  const hovered = normalized.find((item) => item.loop.id === hoveredId) || null;
  const maxTension = Math.max(1, ...normalized.map((item) => item.loop.tensionScore));

  const colorForTension = (score: number) => {
    const ratio = Math.max(0, Math.min(1, score / maxTension));
    // Emerald (low) -> Amber (mid) -> Crimson (high)
    if (ratio < 0.45) {
      const alpha = 0.3 + ratio * 0.5;
      return `rgba(16,185,129,${alpha.toFixed(2)})`;
    }
    if (ratio < 0.75) {
      const alpha = 0.45 + (ratio - 0.45) * 0.9;
      return `rgba(245,158,11,${Math.min(0.85, alpha).toFixed(2)})`;
    }
    const alpha = 0.55 + (ratio - 0.75) * 1.2;
    return `rgba(220,38,38,${Math.min(0.95, alpha).toFixed(2)})`;
  };

  return (
    <section className="rounded-sm border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Tension Heatmap</h2>
        <span className="rounded-sm bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
          Complexity vs Financial Impact
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative h-72 rounded border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/30">
          <div className="pointer-events-none absolute inset-0 grid grid-cols-4 grid-rows-4">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div key={idx} className="border border-slate-800/50" />
            ))}
          </div>

          {normalized.map(({ loop, complexity: x, impact: y }) => {
            const left = `${x}%`;
            const bottom = `${y}%`;
            const selected = selectedLoopId === loop.id;
            const ratio = Math.max(0, Math.min(1, loop.tensionScore / maxTension));
            const intensity = 0.2 + ratio * 0.8;
            return (
              <button
                key={loop.id}
                onMouseEnter={() => setHoveredId(loop.id)}
                onMouseLeave={() => setHoveredId((current) => (current === loop.id ? null : current))}
                onClick={() => onSelectLoop?.(loop.id)}
                className={`absolute -translate-x-1/2 translate-y-1/2 rounded-full border transition-all ${
                  selected ? 'border-emerald-300 shadow-lg shadow-emerald-500/30' : 'border-slate-200/70'
                }`}
                style={{
                  left,
                  bottom,
                  width: `${12 + intensity * 16}px`,
                  height: `${12 + intensity * 16}px`,
                  background: colorForTension(loop.tensionScore),
                }}
                aria-label={`${loop.vendor} tension node`}
              />
            );
          })}

          <div className="pointer-events-none absolute bottom-2 left-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">
            Low Complexity
          </div>
          <div className="pointer-events-none absolute bottom-2 right-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">
            High Complexity
          </div>
          <div className="pointer-events-none absolute left-2 top-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">
            High Impact
          </div>
          <div className="pointer-events-none absolute left-2 bottom-8 text-[11px] uppercase tracking-[0.14em] text-slate-500">
            Low Impact
          </div>
        </div>

        <div className="rounded border border-slate-800 bg-slate-950 p-3">
          {!hovered ? (
            <p className="text-sm text-slate-400">Hover a node to inspect bridge recommendation.</p>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Bridge Recommendation</p>
              <p className="mt-1 text-sm font-medium text-slate-100">{hovered.loop.vendor}</p>
              <p className="text-xs text-slate-400">{hovered.loop.type.replace('_', ' ')}</p>
              <p className="mt-2 text-sm text-emerald-300">{hovered.recommendation.lane} · {hovered.recommendation.type}</p>
              <p className="mt-1 text-sm text-slate-300">
                Expected Delta: {formatCurrency(hovered.recommendation.expectedDelta)}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Why: This loop sits at complexity {hovered.complexity}/100 and impact {hovered.impact}/100, with
                tension score {hovered.loop.tensionScore}, so the match engine prioritizes {hovered.recommendation.lane}.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
