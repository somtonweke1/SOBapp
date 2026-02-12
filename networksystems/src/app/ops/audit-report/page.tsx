'use client';

import { useMemo } from 'react';

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
    <div className="min-h-screen bg-[#050505] text-emerald-100 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-10 shadow-2xl backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-400">OPS / AUDIT REPORT</p>
        <h1 className="mt-4 text-3xl font-semibold text-emerald-100">
          Systemic Operational Deadlock detected at {report.department}.
        </h1>
        <p className="mt-3 text-emerald-200/80">
          Recovery Solution: Ready for Deployment. Fee: ${report.fee.toLocaleString()}.
        </p>

        <div className="mt-8 space-y-4 text-sm text-emerald-200/80">
          <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">The Data Proof</p>
            <p className="mt-2">
              Vendor {report.vendor} has extracted ${report.avoidablePenalties.toLocaleString()} in avoidable penalties
              due to scheduling lag identified via SOBapp Forensics.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Root Cause</p>
            <p className="mt-2">{report.rootCause}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Abatement Cost</p>
            <p className="mt-2">Deployment of SOBapp Dynamic Routing Script.</p>
            <p className="mt-2">Estimated Annual Savings: ${report.annualWaste.toLocaleString()}.</p>
            <p className="mt-2">${report.fee.toLocaleString()} Flat Fee. {report.deploymentWindow} Implementation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
