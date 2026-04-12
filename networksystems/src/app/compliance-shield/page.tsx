'use client';

import Link from 'next/link';
import StoneBridgeShell from '@/components/stonebridge/shell/StoneBridgeShell';
import ProcessPanel from '@/components/stonebridge/shell/ProcessPanel';

export default function ComplianceShieldPage() {
  return (
    <StoneBridgeShell
      activeMode="compliance"
      title="Compliance Bridge / Environmental Risk"
      subtitle="We surface exposure and build an audit-ready trail for faster dispute resolution. CERCLA and cradle-to-grave liability are treated as leverage: quantify, document, abate."
      primaryAction={
        <Link
          href="/compliance-shield/report"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          Generate Report
        </Link>
      }
      secondaryAction={
        <Link
          href="/dashboard?shield=compliance#shields"
          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 shadow-sm transition-colors hover:bg-white"
        >
          Back
        </Link>
      }
      aside={
        <ProcessPanel
          steps={[
            'Select a corridor or property context.',
            'Surface exposure signals and supporting public records.',
            'Generate an audit-ready evidence packet.',
          ]}
          bullets={[
            'Lender/counsel-friendly narrative.',
            'Chain-of-custody emphasis (manifest/COD).',
            'Designed for regulatory closure, not noise.',
          ]}
          ctas={[
            { href: '/compliance-shield/report', label: 'Generate Packet', tone: 'primary' },
            { href: '/dashboard?shield=compliance#shields', label: 'Back to Shields', tone: 'secondary' },
          ]}
        />
      }
    >
      <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">What This Does</p>
        <div className="mt-4 space-y-4 text-sm font-light text-zinc-700">
          <div className="rounded-xl border border-zinc-200/50 bg-white/80 p-4">
            <div className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Public Record Overlay</div>
            <div className="mt-2 text-zinc-700">
              Permits, violations, historic use flags, and adjacent site signals. No permission required.
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200/50 bg-white/80 p-4">
            <div className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Audit Trail</div>
            <div className="mt-2 text-zinc-700">
              A clean evidence packet: sources, timestamps, and summaries that can be handed to counsel, lenders, or regulators.
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200/50 bg-white/80 p-4">
            <div className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Abatement Workflow</div>
            <div className="mt-2 text-zinc-700">
              Translate risk into actions: Phase I/II prompts, manifests, and dispute-ready documentation.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Compliance Hunter</p>
        <p className="mt-3 text-sm font-light text-zinc-600">
          Run a name + zip check against EPA ECHO to find missing public record footprints and prioritize manual verification.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/compliance/hunter"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Open Compliance Hunter
          </Link>
          <Link
            href="/compliance-shield/report"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white/70 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-zinc-700 shadow-sm transition-colors hover:bg-white"
          >
            Generate Packet
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Back-End Partner</p>
        <p className="mt-3 text-sm font-light text-zinc-600">
          Front-end: forensic audit + liability consulting. Back-end: logistics, manifests, certificates of destruction.
          The product is proof.
        </p>
        <div className="mt-5 rounded-xl border border-zinc-200/50 bg-white/80 p-4 text-sm font-light text-zinc-700">
          <div className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Outputs</div>
          <ul className="mt-3 list-disc pl-5">
            <li>CERCLA / RCRA exposure summary</li>
            <li>Waste stream inventory (clinic, lab, tenant)</li>
            <li>Manifest chain-of-custody packet</li>
            <li>Site-ready certification draft</li>
          </ul>
        </div>
      </div>
    </StoneBridgeShell>
  );
}
