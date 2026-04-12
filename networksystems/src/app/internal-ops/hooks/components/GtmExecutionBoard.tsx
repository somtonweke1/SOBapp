'use client';

import { useMemo, useState, useTransition } from 'react';
import CopyPitchButton from './CopyPitchButton';
import { updateGtmTargetStatusAction } from '@/app/actions/gtm-targets';
import type { GtmStatus } from '@/lib/gtm-target-store';
import type { RiskFlag } from '@/lib/risk/engine';

type Target = {
  id: string;
  name: string;
  hq: string;
  segment: string;
  persona: 'Acquisitions' | 'Asset Management';
  trigger: string;
};

type Props = {
  targets: Target[];
  initialStatuses: Record<string, { status: GtmStatus; notes: string; updatedAt: string }>;
  liveSignals: RiskFlag[];
};

const STATUS_OPTIONS: GtmStatus[] = ['NEW', 'CONTACTED', 'REPLIED', 'QUALIFIED', 'CLOSED_WON', 'CLOSED_LOST'];

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function pitchFor(target: Target): string {
  if (target.persona === 'Acquisitions') {
    return `StoneBridge diagnoses hidden deal risk for Baltimore emerging developers before acquisition or rehab. For ${target.name}, we fuse utility, property, procurement, and infrastructure signals into a Proceed/Caution/Escalate memo so the acquisitions team can underwrite with cleaner eyes.`;
  }
  return `StoneBridge turns scattered public records into a decision memo for operators and asset managers. We use property, utility, procurement, and infrastructure evidence to show whether a Baltimore deal should proceed, pause, or escalate before rehab capital is committed.`;
}

export default function GtmExecutionBoard({ targets, initialStatuses, liveSignals }: Props) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [pending, startTransition] = useTransition();
  const [activeTarget, setActiveTarget] = useState<string>('');

  const prioritySignals = useMemo(
    () => [...liveSignals].sort((a, b) => (b.challengeScore || 0) - (a.challengeScore || 0)).slice(0, 5),
    [liveSignals]
  );

  const updateStatus = (targetId: string, status: GtmStatus) => {
    const prev = statuses[targetId];
    setStatuses((current) => ({
      ...current,
      [targetId]: {
        status,
        notes: current[targetId]?.notes || '',
        updatedAt: new Date().toISOString(),
      },
    }));

    startTransition(async () => {
      try {
        await updateGtmTargetStatusAction({
          targetId,
          status,
          notes: prev?.notes || '',
        });
      } catch {
        setStatuses((current) => ({
          ...current,
          [targetId]: prev || { status: 'NEW', notes: '', updatedAt: new Date(0).toISOString() },
        }));
      }
    });
  };

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-2xl border border-zinc-200/60 bg-white/90 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Deal Diagnostic Signals</p>
            <h2 className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">Who Needs Outreach This Week</h2>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-600">
            Diagnostic memo = $199
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {prioritySignals.map((flag) => (
            <article key={flag.id} className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-4">
              <p className="text-sm font-medium text-zinc-900">{flag.indicator}</p>
              <p className="mt-1 text-xs text-zinc-600">
                {flag.agency} · {flag.vendor} · {currency(flag.exposure)} · {(flag.challengeScore || 0)}% defensible
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/60 bg-white/90 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">GTM Execution Board</p>
        <h3 className="mt-1 text-2xl font-extralight tracking-tight text-zinc-900">Target Accounts + Outreach Workflow</h3>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-[0.14em] text-zinc-500">
              <tr>
                <th className="px-3 py-2">Account</th>
                <th className="px-3 py-2">Segment</th>
                <th className="px-3 py-2">Persona</th>
                <th className="px-3 py-2">Trigger</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Pitch</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((target) => (
                <tr key={target.id} className="border-t border-zinc-200/80">
                  <td className="px-3 py-3">
                    <p className="font-medium text-zinc-900">{target.name}</p>
                    <p className="text-xs text-zinc-500">{target.hq}</p>
                  </td>
                  <td className="px-3 py-3 text-zinc-700">{target.segment}</td>
                  <td className="px-3 py-3 text-zinc-700">{target.persona}</td>
                  <td className="px-3 py-3 text-zinc-700">{target.trigger}</td>
                  <td className="px-3 py-3">
                    <select
                      value={statuses[target.id]?.status || 'NEW'}
                      disabled={pending}
                      onChange={(e) => updateStatus(target.id, e.target.value as GtmStatus)}
                      className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <CopyPitchButton text={pitchFor(target)} />
                      <button
                        onClick={() => setActiveTarget((current) => (current === target.id ? '' : target.id))}
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-light text-zinc-700 hover:bg-zinc-50"
                      >
                        {activeTarget === target.id ? 'Hide' : 'View'}
                      </button>
                    </div>
                    {activeTarget === target.id && (
                      <p className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-600">{pitchFor(target)}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
