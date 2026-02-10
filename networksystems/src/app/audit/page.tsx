'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import DPWAuditor from '@/components/deal-shield/DPWAuditor';

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

  const handleAuditComplete = useCallback((payload: Omit<StoredAudit, 'timestamp'>) => {
    const entry: StoredAudit = { ...payload, timestamp: new Date().toISOString() };
    localStorage.setItem('sobapp:lastAudit', JSON.stringify(entry));
    setSaved(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="border-b border-slate-800 pb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Baltimore Forensics</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">DPW Water Bill Audit</h1>
          <p className="mt-3 text-slate-300">
            Run a Baltimore DPW audit and capture the discrepancy record for abatement.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/abatement"
              className="rounded-lg border border-emerald-500/40 px-5 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400"
            >
              Generate Abatement Letter
            </Link>
            <Link
              href="/deal-shield"
              className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Test Deal (DSCR)
            </Link>
          </div>
          {saved && (
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-emerald-400">
              Latest audit saved for abatement generation.
            </p>
          )}
        </header>

        <div className="mt-8">
          <DPWAuditor onAuditComplete={handleAuditComplete} />
        </div>
      </div>
    </div>
  );
}
