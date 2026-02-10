'use client';

import Link from 'next/link';
import ThreeDNetworkMap from '@/components/visualization/3d-network-map';

type DistressNode = {
  id: string;
  type: 'mining_site' | 'processing_facility' | 'research_lab' | 'logistics_hub';
  name: string;
  position: {
    lat: number;
    lng: number;
    elevation: number;
  };
  data: {
    production: number;
    efficiency: number;
    status: 'operational' | 'maintenance' | 'offline';
    connections: string[];
  };
};

type DistressEdge = {
  source: string;
  target: string;
  type: 'transport' | 'communication' | 'supply_chain' | 'data_flow';
  strength: number;
  distance: number;
};

const distressNodes: DistressNode[] = [
  {
    id: 'north-avenue-cluster',
    type: 'mining_site',
    name: 'North Ave Rowhouse Cluster',
    position: { lat: 39.3114, lng: -76.6166, elevation: 12 },
    data: { production: 24, efficiency: 78.2, status: 'operational', connections: ['dpw-hub', 'lien-lab'] }
  },
  {
    id: 'west-baltimore-core',
    type: 'processing_facility',
    name: 'West Baltimore Core',
    position: { lat: 39.2905, lng: -76.6349, elevation: 20 },
    data: { production: 41, efficiency: 82.1, status: 'operational', connections: ['north-avenue-cluster', 'harbor-logistics'] }
  },
  {
    id: 'dpw-hub',
    type: 'research_lab',
    name: 'DPW Billing Hub',
    position: { lat: 39.3007, lng: -76.6152, elevation: 18 },
    data: { production: 0, efficiency: 91.4, status: 'operational', connections: ['north-avenue-cluster', 'harbor-logistics'] }
  },
  {
    id: 'harbor-logistics',
    type: 'logistics_hub',
    name: 'Inner Harbor Logistics',
    position: { lat: 39.2847, lng: -76.6082, elevation: 6 },
    data: { production: 16, efficiency: 74.5, status: 'maintenance', connections: ['west-baltimore-core'] }
  },
  {
    id: 'lien-lab',
    type: 'research_lab',
    name: 'Lien Filing Intelligence',
    position: { lat: 39.2989, lng: -76.5941, elevation: 10 },
    data: { production: 0, efficiency: 88.7, status: 'operational', connections: ['north-avenue-cluster'] }
  }
];

const distressEdges: DistressEdge[] = [
  { source: 'north-avenue-cluster', target: 'dpw-hub', type: 'data_flow', strength: 0.82, distance: 2 },
  { source: 'north-avenue-cluster', target: 'lien-lab', type: 'communication', strength: 0.74, distance: 3 },
  { source: 'west-baltimore-core', target: 'harbor-logistics', type: 'transport', strength: 0.61, distance: 4 },
  { source: 'west-baltimore-core', target: 'north-avenue-cluster', type: 'supply_chain', strength: 0.68, distance: 2 }
];

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

const pipeline = [
  { step: 'Audit Submitted', status: 'complete' },
  { step: 'Discrepancy Detected', status: 'complete' },
  { step: 'Abatement Drafted', status: 'active' },
  { step: 'DPW Response', status: 'pending' }
];

const statusStyles: Record<string, string> = {
  complete: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  active: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  pending: 'bg-slate-800 text-slate-400 border-slate-700'
};

const severityStyles: Record<string, string> = {
  high: 'text-amber-300',
  medium: 'text-blue-300',
  low: 'text-emerald-300'
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-6 border-b border-slate-800 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500">SOBapp War Room</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Baltimore Property Distress Map</h1>
            <p className="mt-3 text-slate-300">
              Live intelligence on DPW anomalies, lien filings, and infrastructure risk clusters.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/audit"
              className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
            >
              Start Audit
            </Link>
            <Link
              href="/deal-shield"
              className="rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              Test Deal
            </Link>
            <Link
              href="/abatement"
              className="rounded-lg border border-emerald-500/40 px-5 py-2 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400"
            >
              Premium Export
            </Link>
          </div>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">3D Network Overview</h2>
                <p className="text-sm text-slate-400">Nodes = properties. Links = ownership / infrastructure ties.</p>
              </div>
              <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-blue-200">
                Live
              </span>
            </div>
            <div className="mt-6 h-[420px] overflow-hidden rounded-xl border border-slate-800">
              <ThreeDNetworkMap nodes={distressNodes} edges={distressEdges} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <h3 className="text-lg font-semibold text-white">Real-Time Feed</h3>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mt-2">DPW Forensic Alerts</p>
              <div className="mt-4 space-y-4">
                {realtimeAlerts.map((alert) => (
                  <div key={alert.title} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-200">{alert.title}</span>
                      <span className={`text-xs ${severityStyles[alert.severity]}`}>{alert.time}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{alert.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <h3 className="text-lg font-semibold text-white">Case Progress</h3>
              <p className="text-sm text-slate-400">Audit → Discrepancy → Abatement → Response</p>
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

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <h3 className="text-lg font-semibold text-white">DPW Intelligence Snapshot</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Audits Pending Review</span>
                  <span className="text-blue-300">14</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discrepancy Volume (30d)</span>
                  <span className="text-emerald-300">$92,400</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average CCF Overrun</span>
                  <span className="text-amber-300">22.1%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
