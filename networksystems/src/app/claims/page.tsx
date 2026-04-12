'use client';

import Link from 'next/link';
import StoneBridgeShell from '@/components/stonebridge/shell/StoneBridgeShell';
import ProcessPanel from '@/components/stonebridge/shell/ProcessPanel';

export default function ClaimsPage() {
  return (
    <StoneBridgeShell
      activeMode="asset"
      title="Claims Intake"
      subtitle="Zero subscription. Contingency model enabled. Found money pays for the shield."
      primaryAction={
        <Link
          href="/audit"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          Run Audit
        </Link>
      }
      secondaryAction={
        <Link
          href="/dashboard#shields"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 shadow-sm transition-colors hover:bg-white"
        >
          Back
        </Link>
      }
      aside={
        <ProcessPanel
          steps={[
            'Run a forensic audit (DPW / vendor leakage).',
            'Detect recoverable dollars and generate an evidence packet.',
            'Open abatement workflow and recover under the success fee.',
          ]}
          bullets={[
            'Evidence trail + dispute-ready narrative.',
            'Abatement letter suite preview included.',
            'No upfront software subscription.',
          ]}
          ctas={[
            { href: '/abatement', label: 'Abatement Suite', tone: 'secondary' },
            { href: '/audit', label: 'Run Audit', tone: 'primary' },
          ]}
        />
      }
    >
      <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Coverage</p>
        <div className="mt-4 space-y-4 text-sm font-light text-zinc-700">
          {[
            {
              title: 'Found Money Audit',
              body: 'DPW billing discrepancies, service schedule conflicts, and penalty abatement.',
            },
            {
              title: 'Abatement Packet',
              body: 'Draft-ready artifacts: evidence trail, dispute templates, and recovery ledger.',
            },
            {
              title: 'Environmental Overlay',
              body: 'Historic use flags (medical/dental), permit adjacency, and chain-of-custody proof.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-zinc-200/50 bg-white/80 p-4">
              <div className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">{item.title}</div>
              <div className="mt-2 text-zinc-700">{item.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Existing Claim</p>
        <p className="mt-2 text-sm font-light text-zinc-600">If you already have a case open, sign in and resume.</p>
        <Link
          href="/auth/signin"
          className="mt-3 inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 shadow-sm transition-colors hover:bg-white"
        >
          Sign in
        </Link>
      </div>
    </StoneBridgeShell>
  );
}
