'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import DPWAuditor from '@/components/deal-shield/DPWAuditor';
import ThreeDNetworkMap from '@/components/visualization/3d-network-map';
import { useSession } from 'next-auth/react';

type AuditResult = {
  isError: boolean;
  discrepancyAmount: string;
  actualGallons: number;
  actualCCF: number;
  expectedBill: number;
  actualBill: number;
  tierBreakdown: Array<{ tier: string; gallons: number; cost: number }>;
  errorPercentage: number;
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
};

type StoredAudit = {
  input: {
    meterReadCurrent: number;
    meterReadLast: number;
    totalBill: number;
    serviceCharge?: number;
    sewerCharge?: number;
  };
  result: AuditResult;
  timestamp: string;
};

export default function AuditPage() {
  const [saved, setSaved] = useState(false);
  const [latestAudit, setLatestAudit] = useState<StoredAudit | null>(null);
  const { data: session } = useSession();

  const handleAuditComplete = useCallback(async (payload: Omit<StoredAudit, 'timestamp'>) => {
    const entry: StoredAudit = { ...payload, timestamp: new Date().toISOString() };
    localStorage.setItem('sobapp:lastAudit', JSON.stringify(entry));
    setSaved(true);
    setLatestAudit(entry);
    if (!session?.user?.id) return;

    try {
      await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterReadCurrent: payload.input.meterReadCurrent,
          meterReadLast: payload.input.meterReadLast,
          totalBill: payload.input.totalBill,
          serviceCharge: payload.input.serviceCharge,
          sewerCharge: payload.input.sewerCharge,
          expectedBill: payload.result.expectedBill,
          discrepancyAmount: Number(payload.result.discrepancyAmount),
          errorPercentage: payload.result.errorPercentage,
          severity: payload.result.severity,
          recommendation: payload.result.recommendation,
        }),
      });
    } catch (error) {
      console.error('Failed to save audit:', error);
    }
  }, [session?.user?.id]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <ThreeDNetworkMap nodes={[]} edges={[]} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50/80 via-white/70 to-zinc-100/90 pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <header className="border-b border-zinc-200/50 pb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Baltimore Forensics</p>
          <h1 className="mt-4 text-4xl font-semibold text-zinc-900">Diagnostic Scan: DPW Water Bill Audit</h1>
          <p className="mt-3 text-zinc-600">
            Run a Baltimore DPW scan, surface overcharges, and lock in the evidence trail.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/auth/signup"
              className="rounded-lg border border-emerald-200 px-5 py-2 text-sm font-semibold text-emerald-600 transition hover:border-emerald-300"
            >
              Generate Legal Abatement Letter (SOBapp Members Only)
            </Link>
            <Link
              href="/deal-shield"
              className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              Test Deal (DSCR)
            </Link>
          </div>
          {saved && (
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-emerald-600">
              Latest audit saved for abatement generation.
            </p>
          )}
        </header>

        {latestAudit?.result?.isError && (
          <div className="mt-8 rounded-2xl border border-red-200/60 bg-red-50/80 p-6 text-red-700 shadow-lg">
            <p className="text-xs uppercase tracking-[0.35em] text-red-500">Discrepancy Detected</p>
            <h2 className="mt-3 text-2xl font-semibold text-red-600">Potential Overcharge Identified</h2>
            <p className="mt-2 text-sm text-red-600">
              Estimated discrepancy: ${latestAudit.result.discrepancyAmount}
            </p>
            <Link
              href="/auth/signup"
              className="mt-5 inline-flex items-center rounded-full bg-red-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-red-700"
            >
              Recover These Funds →
            </Link>
          </div>
        )}

        <div className="mt-8">
          <DPWAuditor onAuditComplete={handleAuditComplete} />
        </div>
      </div>
    </div>
  );
}
