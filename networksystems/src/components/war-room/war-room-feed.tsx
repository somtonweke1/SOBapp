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
  high: 'text-rose-300',
  medium: 'text-amber-300',
  low: 'text-emerald-300'
};

export default function WarRoomFeed() {
  return (
    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6 shadow-2xl backdrop-blur-xl">
      <h3 className="text-lg font-semibold text-emerald-100">Real-Time Feed</h3>
      <p className="text-xs uppercase tracking-[0.3em] text-emerald-400 mt-2">DPW Forensic Alerts</p>
      <div className="mt-4 space-y-4">
        {realtimeAlerts.map((alert) => (
          <div key={alert.title} className="rounded-2xl border border-emerald-400/20 bg-black/40 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-emerald-100">{alert.title}</span>
              <span className={`text-xs ${severityStyles[alert.severity]}`}>{alert.time}</span>
            </div>
            <p className="mt-2 text-sm text-emerald-200/80">{alert.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
