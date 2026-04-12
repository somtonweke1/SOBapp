'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import StoneBridgeShell from '@/components/stonebridge/shell/StoneBridgeShell';
import ProcessPanel from '@/components/stonebridge/shell/ProcessPanel';

export default function OpsAuditReport() {
  const report = useMemo(() => {
    return {
      department: 'Institutional Node',
      vendor: 'Veolia',
      avoidablePenalties: 82000,
      annualWaste: 720000,
      rootCause: 'Legacy scheduling / data mismatch',
      fee: 50000,
      deploymentWindow: '14 days',
    };
  }, []);

  return (
    <StoneBridgeShell
      activeMode="asset"
      title={`Ops Audit Report`}
      subtitle={`Systemic Operational Deadlock detected at ${report.department}. Recovery solution ready for deployment.`}
      primaryAction={
        <Link
          href="/ops/proposal?zip=21201"
          className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-white shadow-sm transition-colors hover:bg-amber-700"
        >
          Open Proposal
        </Link>
      }
      secondaryAction={
        <Link
          href="/dashboard?shield=ops#shields"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 shadow-sm transition-colors hover:bg-white"
        >
          Back
        </Link>
      }
      aside={
        <ProcessPanel
          steps={[
            'Detect penalty leakage and vendor concentration.',
            'Package evidence and quantify recoverable dollars.',
            'Execute abatement: schedule + invoice reconciliation.',
          ]}
          bullets={[
            `Avoidable penalties: $${report.avoidablePenalties.toLocaleString()}.`,
            `Deployment window: ${report.deploymentWindow}.`,
            `Flat fee option: $${report.fee.toLocaleString()}.`,
          ]}
        />
      }
    >
      <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <div className="grid gap-4 text-sm font-light text-zinc-700">
          <div className="rounded-xl border border-zinc-200/50 bg-white/80 p-4">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">The Data Proof</p>
            <p className="mt-2">
              Vendor {report.vendor} has extracted ${report.avoidablePenalties.toLocaleString()} in avoidable penalties
              due to scheduling lag identified via StoneBridge Ops Shield.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200/50 bg-white/80 p-4">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Root Cause</p>
            <p className="mt-2">{report.rootCause}</p>
          </div>
          <div className="rounded-xl border border-zinc-200/50 bg-white/80 p-4">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Abatement</p>
            <p className="mt-2">Deployment of schedule + invoice reconciliation workflow.</p>
            <p className="mt-2">Estimated Annual Savings: ${report.annualWaste.toLocaleString()}.</p>
            <p className="mt-2">${report.fee.toLocaleString()} Flat Fee. {report.deploymentWindow} Implementation.</p>
          </div>
        </div>
      </div>
    </StoneBridgeShell>
  );
}
