'use client';

const pipeline = [
  { step: 'Audit Submitted', status: 'complete' },
  { step: 'Discrepancy Detected', status: 'complete' },
  { step: 'Abatement Drafted', status: 'active' },
  { step: 'DPW Response', status: 'pending' }
];

const statusStyles: Record<string, string> = {
  complete: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/30',
  active: 'bg-amber-500/10 text-amber-200 border-amber-400/30',
  pending: 'bg-black/40 text-emerald-200/70 border-emerald-400/20'
};

export default function WarRoomPipeline() {
  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-2xl backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-emerald-100">Case Progress</h3>
      <p className="text-sm text-emerald-200/80">Audit → Discrepancy → Abatement → Response</p>
      <div className="mt-4 space-y-3">
        {pipeline.map((item) => (
          <div
            key={item.step}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${statusStyles[item.status]}`}
          >
            <span>{item.step}</span>
            <span className="text-xs uppercase tracking-[0.2em]">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
