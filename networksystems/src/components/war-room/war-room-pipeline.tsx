'use client';

const pipeline = [
  { step: 'Audit Submitted', status: 'complete' },
  { step: 'Discrepancy Detected', status: 'complete' },
  { step: 'Abatement Drafted', status: 'active' },
  { step: 'DPW Response', status: 'pending' }
];

const statusStyles: Record<string, string> = {
  complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  active: 'bg-blue-50 text-blue-700 border-blue-200',
  pending: 'bg-zinc-50 text-zinc-600 border-zinc-200'
};

export default function WarRoomPipeline() {
  return (
    <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 shadow-2xl backdrop-blur">
      <h3 className="text-lg font-semibold text-zinc-900">Case Progress</h3>
      <p className="text-sm text-zinc-600">Audit → Discrepancy → Abatement → Response</p>
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
