'use client';

export default function WarRoomSnapshot() {
  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-2xl backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-emerald-100">DPW Intelligence Snapshot</h3>
      <div className="mt-4 grid gap-3 text-sm text-emerald-200/80">
        <div className="flex items-center justify-between">
          <span>Audits Pending Review</span>
          <span className="text-emerald-300 font-forensic">14</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Discrepancy Volume (30d)</span>
          <span className="text-emerald-300 font-forensic">$92,400</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Average CCF Overrun</span>
          <span className="text-amber-300 font-forensic">22.1%</span>
        </div>
      </div>
    </div>
  );
}
