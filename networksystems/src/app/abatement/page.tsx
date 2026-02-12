'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type AuditSnapshot = {
  input?: {
    meterReadCurrent?: number;
    meterReadLast?: number;
    totalBill?: number;
  };
  result?: {
    discrepancyAmount?: string;
    expectedBill?: number;
  };
  timestamp?: string;
};

export default function AbatementPage() {
  const [snapshot, setSnapshot] = useState<AuditSnapshot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sobapp:lastAudit');
    if (!stored) return;
    try {
      const parsed: AuditSnapshot = JSON.parse(stored);
      setSnapshot(parsed);
    } catch {
      // ignore parse errors
    }
  }, []);

  const buildDisputeLetter = useMemo(() => {
    const auditDate = snapshot?.timestamp ? new Date(snapshot.timestamp).toLocaleDateString() : '[Insert Date]';
    const totalBill = snapshot?.input?.totalBill ? snapshot.input.totalBill.toFixed(2) : '[Bill Amount]';
    const expectedBill = snapshot?.result?.expectedBill ? snapshot.result.expectedBill.toFixed(2) : '[Expected Max]';
    const discrepancy = snapshot?.result?.discrepancyAmount ?? '[Discrepancy]';
    const meterLast = snapshot?.input?.meterReadLast?.toFixed(2) ?? '[Last]';
    const meterCurrent = snapshot?.input?.meterReadCurrent?.toFixed(2) ?? '[Current]';
    const meterDelta = snapshot?.input?.meterReadCurrent && snapshot?.input?.meterReadLast
      ? (snapshot.input.meterReadCurrent - snapshot.input.meterReadLast).toFixed(2)
      : '[Usage Delta]';

    return `NOTICE OF DISPUTE - DPW WATER BILL

Date: ${auditDate}
To: Baltimore City Department of Public Works
Re: Disputed Water Bill for [Property Address]

I am submitting a formal dispute for the DPW water bill associated with the property listed above.
Account Number: [Insert Account #]
Meter Readings: ${meterLast} CCF to ${meterCurrent} CCF
Meter Reading Discrepancy: ${meterDelta} CCF
Total Billed Amount: $${totalBill}
Expected Maximum (CCF @ $17.64 + baseline): $${expectedBill}
Estimated Overcharge / Discrepancy: $${discrepancy}

This is a formal dispute of charges under the Water Accountability and Equity Act. I am requesting a formal investigation by the Customer Support and Services Division (CSSD) and, if unresolved, a hearing before the Environmental Control Board (ECB). I am paying the undisputed portion of my bill as required by law while this investigation is pending.

Based on SOBapp forensic audit calculations, the bill appears to exceed the expected maximum for recorded usage.
Please investigate and issue a corrected statement or written justification for the variance.

Requested Action:
1. Recalculate the bill using verified meter readings.
2. Provide a written explanation for any additional charges.
3. Apply credits or abatement if overcharges are confirmed.

Sincerely,
[Owner Name]
[Property Address]`;
  }, [snapshot]);

  const previewLetter = buildDisputeLetter;

  const handleDownload = () => {
    try {
      setIsDownloading(true);
      const blob = new Blob([buildDisputeLetter], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dpw-dispute-letter-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="border-b border-zinc-200/50 pb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Member Portal Preview</p>
          <h1 className="mt-4 text-4xl font-semibold">Abatement Letter Suite</h1>
          <p className="mt-3 text-zinc-600">
            This is a locked preview of the official DPW dispute letter generator.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-emerald-600">
            Members Only
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/audit"
              className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              Back to Audit
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-emerald-200 px-5 py-2 text-sm font-semibold text-emerald-600 transition hover:border-emerald-300"
            >
              View War Room Preview
            </Link>
          </div>
        </header>

        <div className="mt-10 rounded-2xl border border-zinc-200/50 bg-white/80 p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Abatement Letter</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownload}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-700 transition hover:border-zinc-300"
                disabled={isDownloading}
              >
                {isDownloading ? 'Preparing...' : 'Download Letter (TXT)'}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700"
              >
                Start a Claim
              </button>
            </div>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-xl border border-zinc-200/60 bg-white/90">
            <pre className="whitespace-pre-wrap px-6 py-5 text-xs text-zinc-700 blur-md">
              {previewLetter}
            </pre>
            <div className="pointer-events-none absolute inset-0 bg-white/70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-sm font-semibold text-zinc-900">Unlock the full legal template + export tools.</p>
              <Link
                href="/claims"
                className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700"
              >
                Start a Claim
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 px-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200/60 bg-white/95 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">Sons of Baltimore Access</p>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-900">Unlock the Abatement Suite</h2>
            <p className="mt-3 text-sm text-zinc-600">
              Your claim unlocks the official DPW dispute letter, export-ready PDFs, and the War Room property map.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/claims"
                className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white text-center transition hover:bg-emerald-700"
              >
                Start Claim Intake
              </Link>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
