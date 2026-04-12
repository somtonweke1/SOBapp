'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import StoneBridgeShell from '@/components/stonebridge/shell/StoneBridgeShell';
import ProcessPanel from '@/components/stonebridge/shell/ProcessPanel';

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
    <StoneBridgeShell
      activeMode="asset"
      title="Abatement Letter Suite (Preview)"
      subtitle="A locked preview of the DPW dispute generator. Convert to a claim to unlock export-ready artifacts."
      primaryAction={
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          Start Claim
        </button>
      }
      secondaryAction={
        <Link
          href="/audit"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 shadow-sm transition-colors hover:bg-white"
        >
          Back
        </Link>
      }
      aside={
        <ProcessPanel
          steps={[
            'Run the DPW audit and capture the discrepancy.',
            'Generate an abatement-ready dispute narrative.',
            'Convert to a claim to unlock exports and packaging.',
          ]}
          bullets={[
            'Dispute letter template with the right facts.',
            'Evidence packet format (lender/counsel friendly).',
            'Claim unlocks exports and next-step routing.',
          ]}
          ctas={[
            { href: '/audit', label: 'Run Audit', tone: 'secondary' },
            { href: '/claims?zip=21201', label: 'Claims Intake', tone: 'primary' },
          ]}
        />
      }
    >
      <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Abatement Letter</p>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 transition-colors hover:bg-white"
            disabled={isDownloading}
          >
            {isDownloading ? 'Preparing...' : 'Download Preview (TXT)'}
          </button>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-xl border border-zinc-200/60 bg-white/90">
          <pre className="whitespace-pre-wrap px-6 py-5 text-xs text-zinc-700 blur-md">
            {previewLetter}
          </pre>
          <div className="pointer-events-none absolute inset-0 bg-white/70" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm font-light text-zinc-900">Unlock the full template and export tools by starting a claim.</p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-light uppercase tracking-[0.3em] text-white transition-colors hover:bg-emerald-700"
            >
              Start a Claim
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 px-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200/60 bg-white/95 p-6 shadow-2xl">
            <p className="text-xs font-light uppercase tracking-[0.35em] text-zinc-400">StoneBridge Access</p>
            <h2 className="mt-3 text-2xl font-extralight tracking-tight text-zinc-900">Unlock the Abatement Suite</h2>
            <p className="mt-3 text-sm font-light text-zinc-600">
              Your claim unlocks the official DPW dispute letter, export-ready artifacts, and the War Room map.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/claims?zip=21201"
                className="rounded-lg bg-emerald-600 px-4 py-3 text-sm font-light text-white text-center transition-colors hover:bg-emerald-700"
              >
                Start Claim Intake
              </Link>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-zinc-200 bg-white/70 px-4 py-3 text-sm font-light text-zinc-700 transition-colors hover:bg-white"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </StoneBridgeShell>
  );
}
