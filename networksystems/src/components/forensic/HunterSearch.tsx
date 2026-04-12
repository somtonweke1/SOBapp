'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ForensicMode } from '@/lib/api/forensic-scan';

type HunterSearchProps = {
  initialMode?: ForensicMode;
  initialAddress?: string;
  isPending?: boolean;
  onSubmit: (input: { address: string; mode: ForensicMode }) => void;
  onModeChange?: (mode: ForensicMode) => void;
};

export default function HunterSearch({
  initialMode = 'asset',
  initialAddress = '',
  isPending = false,
  onSubmit,
  onModeChange,
}: HunterSearchProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ForensicMode>(initialMode);
  const [address, setAddress] = useState(initialAddress || '100 N Light St, Baltimore, MD 21202');
  const [redirectNotice, setRedirectNotice] = useState('');

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (initialAddress.trim()) setAddress(initialAddress);
  }, [initialAddress]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = address.trim();
    if (!target) return;

    if (/^\d{5}$/.test(target)) {
      setRedirectNotice('Redirecting to Sector Scan...');
      router.push(`/recon?zip=${encodeURIComponent(target)}`);
      return;
    }

    setRedirectNotice('');
    onSubmit({ mode, address: target });
  };

  const switchMode = (nextMode: ForensicMode) => {
    setMode(nextMode);
    onModeChange?.(nextMode);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-12">
      <div className="mb-8 max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Client-facing diagnostic entry</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
          Prove the risk fast, then sell the decision memo.
        </h1>
        <p className="mt-4 text-base leading-7 text-gray-600">
          The free scan is the proof layer. The paid product is a decision-grade memo that tells a sponsor, lender,
          or operator whether to proceed, pause, or escalate before capital gets trapped.
        </p>
      </div>

      <div className="mb-6 grid w-full gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Free preview</p>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            Address-level scan of live public records, data-source status, and evidence preview.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Paid product</p>
          <p className="mt-2 text-sm leading-6 text-gray-800">
            24-hour memo with Proceed / Caution / Escalate call, source-backed rationale, and diligence questions.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Retainer path</p>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            Ongoing diligence, monitoring, and packet support when the preview reveals real pressure.
          </p>
        </div>
      </div>

      <div className="mb-4 inline-flex rounded-full border border-gray-300 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => switchMode('asset')}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            mode === 'asset' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          Asset Shield (Water/Lien)
        </button>
        <button
          type="button"
          onClick={() => switchMode('compliance')}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            mode === 'compliance' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          Compliance Shield (EPA/Waste)
        </button>
      </div>

      <form onSubmit={submit} className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <label htmlFor="hunter-address" className="mb-2 block text-sm font-semibold text-gray-900">
          Subject address
        </label>
        <div className="relative">
          <input
            id="hunter-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder={mode === 'asset' ? 'Enter property address for acquisition or rehab review' : 'Enter facility address for compliance review'}
            className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-4 text-lg text-gray-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            disabled={isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Scanning...' : 'Run Forensic Scan'}
          </button>
        </div>
        {redirectNotice ? <p className="mt-3 text-sm font-medium text-emerald-700">{redirectNotice}</p> : null}
        <div className="mt-5 grid gap-3 text-sm text-gray-600 md:grid-cols-3">
          <div className="rounded-xl bg-gray-50 px-4 py-3">1. Scan the public record layer.</div>
          <div className="rounded-xl bg-gray-50 px-4 py-3">2. Preview the evidence and decision direction.</div>
          <div className="rounded-xl bg-gray-50 px-4 py-3">3. Escalate into the paid memo when the deal is live.</div>
        </div>
      </form>
    </div>
  );
}
