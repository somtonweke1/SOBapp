'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('sobapp:contingencyAgreement');
    if (stored === 'accepted') {
      setAgreementAccepted(true);
      setIsAgreementModalOpen(false);
      return;
    }
    setIsAgreementModalOpen(true);
  }, []);

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
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-emerald-100">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <ThreeDNetworkMap nodes={[]} edges={[]} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/90 pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <header className="border-b border-zinc-200/50 pb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">AUDIT TERMINAL</p>
          <h1 className="mt-4 text-4xl font-semibold text-emerald-100">DPW_SCAN: EXECUTE</h1>
          <p className="mt-3 text-emerald-200/80">
            FORENSIC TRACE ENGAGED. RESULTS LOCKED UNTIL AGREEMENT.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/claims"
              className="rounded-lg border border-emerald-400/40 px-5 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400/70"
            >
              Start a Recovery Claim
            </Link>
            <Link
              href="/deal-shield"
              className="rounded-lg border border-emerald-400/30 px-5 py-2 text-sm font-semibold text-emerald-200/80 transition hover:border-emerald-400/60"
            >
              Test Deal (DSCR)
            </Link>
          </div>
          {saved && (
            <p className="mt-4 text-xs uppercase tracking-[0.3em] text-emerald-300">
              Latest audit saved for abatement generation.
            </p>
          )}
        </header>

        {agreementAccepted && latestAudit?.result?.isError && (
          <div className="mt-8 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-rose-200 shadow-lg">
            <p className="text-xs uppercase tracking-[0.35em] text-rose-300">Leak Detected</p>
            <h2 className="mt-3 text-2xl font-semibold text-rose-200">Potential Overcharge Identified</h2>
            <p className="mt-2 text-sm text-rose-200">
              Estimated discrepancy: ${latestAudit.result.discrepancyAmount}
            </p>
            <Link
              href="/claims"
              className="mt-5 inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-100 transition hover:bg-rose-500/30"
            >
              Convert to Claim →
            </Link>
          </div>
        )}

        <div className="mt-8">
          <DPWAuditor
            onAuditComplete={handleAuditComplete}
            canViewResults={agreementAccepted}
            onRequestAgreement={() => setIsAgreementModalOpen(true)}
          />
        </div>
      </div>

      {isAgreementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-lg rounded-3xl border border-emerald-400/20 bg-black/90 p-6 shadow-2xl">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-400">Contingency Agreement</p>
            <h2 className="mt-3 text-2xl font-semibold text-emerald-100">Before We Run the Full Audit</h2>
            <p className="mt-3 text-sm text-emerald-200/80">
              Review and accept the contingency terms to unlock forensic results.
            </p>
            <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-200">
              I agree to a 30% success fee on all capital recovered via SOBapp audits and acknowledge the Terms of Service.
            </div>
            <label className="mt-4 flex items-start gap-3 text-sm text-emerald-200/80">
              <input
                type="checkbox"
                checked={agreementChecked}
                onChange={(event) => setAgreementChecked(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-emerald-400/40 text-emerald-400 focus:ring-emerald-500"
              />
              I understand and accept the contingency agreement.
            </label>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsAgreementModalOpen(false)}
                className="rounded-lg border border-emerald-400/30 px-4 py-2 text-sm font-semibold text-emerald-200/80 transition hover:border-emerald-400/60"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!agreementChecked) return;
                  localStorage.setItem('sobapp:contingencyAgreement', 'accepted');
                  setAgreementAccepted(true);
                  setIsAgreementModalOpen(false);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  agreementChecked
                    ? 'bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30'
                    : 'bg-emerald-500/10 text-emerald-300/40 cursor-not-allowed'
                }`}
                disabled={!agreementChecked}
              >
                Agree & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
