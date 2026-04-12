'use client';

import { useMemo, useState } from 'react';
import type { TruthCaseFlag } from '@/lib/risk/truth-types';

type Props = {
  initialFlags: TruthCaseFlag[];
};

type FeedbackState = {
  [fingerprint: string]: {
    status: 'idle' | 'saving' | 'saved' | 'error';
    message?: string;
  };
};

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TruthCaseClient({ initialFlags }: Props) {
  const [feedback, setFeedback] = useState<FeedbackState>({});
  const flags = useMemo(() => [...initialFlags].sort((a, b) => b.exposure - a.exposure), [initialFlags]);

  const submit = async (flag: TruthCaseFlag, verdict: 'ACCEPT' | 'REJECT') => {
    const reason = window.prompt(
      verdict === 'ACCEPT'
        ? 'Why is this signal valid?'
        : 'Why is this signal a false positive?',
      verdict === 'ACCEPT'
        ? 'Evidence and logic are sufficient for triage.'
        : 'Insufficient context or source does not support this signal.'
    );
    if (!reason || reason.trim().length < 8) return;

    setFeedback((prev) => ({
      ...prev,
      [flag.fingerprint]: { status: 'saving' },
    }));

    try {
      const response = await fetch('/api/truth/maryland-procurement/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagId: flag.flagId,
          fingerprint: flag.fingerprint,
          ruleId: flag.ruleId,
          verdict,
          reason: reason.trim(),
          reviewer: 'Analyst',
        }),
      });
      if (!response.ok) {
        setFeedback((prev) => ({
          ...prev,
          [flag.fingerprint]: { status: 'error', message: 'Failed to save review' },
        }));
        return;
      }
      setFeedback((prev) => ({
        ...prev,
        [flag.fingerprint]: { status: 'saved', message: verdict === 'ACCEPT' ? 'Accepted' : 'Rejected' },
      }));
    } catch {
      setFeedback((prev) => ({
        ...prev,
        [flag.fingerprint]: { status: 'error', message: 'Network error' },
      }));
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200/60 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-zinc-900">Top Signals (Analyst Feedback Loop)</h2>
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Accept / Reject updates confidence calibration</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-[0.14em] text-zinc-500">
            <tr>
              <th className="px-3 py-2">Signal</th>
              <th className="px-3 py-2">Exposure</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Rule</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {flags.map((flag) => {
              const state = feedback[flag.fingerprint]?.status || 'idle';
              const message = feedback[flag.fingerprint]?.message;
              return (
                <tr key={flag.fingerprint} className="border-t border-zinc-200/80 align-top">
                  <td className="px-3 py-3">
                    <p className="font-medium text-zinc-900">{flag.indicator}</p>
                    <p className="mt-1 text-xs text-zinc-500">{flag.agency}</p>
                    <a href={flag.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-emerald-700 underline">
                      Source Link
                    </a>
                    <p className="mt-1 text-xs text-zinc-500">{flag.logicTrace}</p>
                  </td>
                  <td className="px-3 py-3 font-mono text-zinc-800">{currency(flag.exposure)}</td>
                  <td className="px-3 py-3">
                    <p className="font-mono text-zinc-800">{Math.round(flag.confidence * 100)}%</p>
                    <p className="text-xs text-zinc-500">
                      base {Math.round(flag.confidenceBase * 100)}% ({flag.calibrationAdjustment >= 0 ? '+' : ''}
                      {Math.round(flag.calibrationAdjustment * 100)} pts)
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-mono text-xs text-zinc-700">{flag.ruleId}</p>
                    <p className="text-xs text-zinc-500">{flag.reviewsForRule} reviews</p>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => submit(flag, 'ACCEPT')}
                        disabled={state === 'saving'}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => submit(flag, 'REJECT')}
                        disabled={state === 'saving'}
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                    {message && <p className="mt-2 text-xs text-zinc-500">{message}</p>}
                  </td>
                </tr>
              );
            })}
            {flags.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-zinc-500" colSpan={5}>
                  No findings available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
