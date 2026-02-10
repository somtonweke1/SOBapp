'use client';

const realtimeAlerts = [
  {
    title: 'DPW Forensic Alert',
    detail: 'CCF spike detected at 21217 block',
    time: '4m ago',
    severity: 'high'
  },
  {
    title: 'New Lien Filing',
    detail: 'Lien recorded for 1507 Laurens St',
    time: '18m ago',
    severity: 'medium'
  },
  {
    title: 'Audit Queue Update',
    detail: '3 new audits flagged for overcharge review',
    time: '35m ago',
    severity: 'low'
  }
];

const severityStyles: Record<string, string> = {
  high: 'text-amber-600',
  medium: 'text-blue-600',
  low: 'text-emerald-600'
};

export default function WarRoomFeed() {
  return (
    <div className="rounded-2xl border border-zinc-200/50 bg-white/60 p-6 shadow-2xl backdrop-blur">
      <h3 className="text-lg font-semibold text-zinc-900">Real-Time Feed</h3>
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mt-2">DPW Forensic Alerts</p>
      <div className="mt-4 space-y-4">
        {realtimeAlerts.map((alert) => (
          <div key={alert.title} className="rounded-lg border border-zinc-200/50 bg-white/95 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-zinc-800">{alert.title}</span>
              <span className={`text-xs ${severityStyles[alert.severity]}`}>{alert.time}</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">{alert.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
