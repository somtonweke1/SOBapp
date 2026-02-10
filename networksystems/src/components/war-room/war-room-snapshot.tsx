'use client';

export default function WarRoomSnapshot() {
  return (
    <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 shadow-2xl backdrop-blur">
      <h3 className="text-lg font-semibold text-zinc-900">DPW Intelligence Snapshot</h3>
      <div className="mt-4 grid gap-3 text-sm text-zinc-600">
        <div className="flex items-center justify-between">
          <span>Audits Pending Review</span>
          <span className="text-blue-600">14</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Discrepancy Volume (30d)</span>
          <span className="text-emerald-600">$92,400</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Average CCF Overrun</span>
          <span className="text-amber-600">22.1%</span>
        </div>
      </div>
    </div>
  );
}
