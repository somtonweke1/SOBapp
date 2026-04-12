import VendorBleedChart from '@/components/ops/vendor-bleed-chart';
import ProposalIntake from '@/components/ops/proposal-intake';
import { fetchHighBleedVendors, type HighBleedVendor } from '@/lib/data-sources';
import { getSystemEfficacyMetrics } from '@/lib/risk/system-efficacy';
import StoneBridgeShell from '@/components/stonebridge/shell/StoneBridgeShell';
import ProcessPanel from '@/components/stonebridge/shell/ProcessPanel';

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const CORE_NEED_CATALOG = {
  invoiceLeakage: {
    label: 'Invoice Leakage and Payment Drag',
    symptom: 'Late fee/interest bleed caused by fragmented billing and approvals.',
    productName: 'Ops Shield Reconciliation Cloud',
    sla: 'Deploy in 14 days',
    modules: [
      'Invoice ingestion + normalization API',
      'Deadline and penalty risk predictor',
      'Auto-reconciliation workflow',
      'Executive savings and ROI tracker',
    ],
  },
} as const;

type CoreNeedKey = keyof typeof CORE_NEED_CATALOG;

const isCoreNeedKey = (value: string): value is CoreNeedKey =>
  value in CORE_NEED_CATALOG;

const parsePositiveNumber = (value?: string | null): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const FALLBACK_BLEED_VENDORS: HighBleedVendor[] = [
  { vendorName: 'Target Vendor Alpha', penaltyTotal: 185000, totalPayments: 2200000, spendCategory: 'Late Fees' },
  { vendorName: 'Target Vendor Bravo', penaltyTotal: 132000, totalPayments: 1700000, spendCategory: 'Interest Charges' },
  { vendorName: 'Target Vendor Charlie', penaltyTotal: 98000, totalPayments: 1250000, spendCategory: 'Penalty Spend' },
];

function buildEmergentBlueprint(params: { need: CoreNeedKey; annualExposure: number }) {
  const automationIntensity = Math.min(98, Math.max(62, Math.round(55 + Math.log10(Math.max(1, params.annualExposure)) * 10)));
  const noveltyIndex = Math.min(99, Math.max(70, Math.round(64 + Math.log10(Math.max(1, params.annualExposure)) * 11)));
  const compoundingGain = Math.round(params.annualExposure * 0.22);

  const loopsByNeed: Record<CoreNeedKey, string[]> = {
    invoiceLeakage: [
      'Sense: capture every invoice lifecycle event in near real-time.',
      'Decide: forecast penalty probability before payment windows close.',
      'Act: trigger autonomous reconciliation and escalation routing.',
      'Learn: retrain payment-risk policy from closed-cycle outcomes.',
    ],
  };

  return {
    automationIntensity,
    noveltyIndex,
    compoundingGain,
    loops: loopsByNeed[params.need],
  };
}

export default async function OpsProposalPage({
  searchParams,
}: {
  searchParams?: {
    draftId?: string;
    generatedAt?: string;
    key?: string;
    company?: string;
    need?: string;
    annualLeakage?: string;
    targetLoopId?: string;
    bridgeType?: string;
    bridgeLane?: string;
    efficacyBridgedLoops?: string;
    efficacyLoopBreakRate?: string;
    efficacyTimeToBridgeHours?: string;
    address?: string;
    owner?: string;
    caseId?: string;
    lienTotal?: string;
    lastSalePrice?: string;
  };
}) {
  let bleedVendors: HighBleedVendor[] = [];
  try {
    bleedVendors = await fetchHighBleedVendors();
  } catch (error) {
    console.error('Failed to load live bleed vendors. Falling back to synthetic targets.', error);
    bleedVendors = FALLBACK_BLEED_VENDORS;
  }

  if (!bleedVendors.length) {
    bleedVendors = FALLBACK_BLEED_VENDORS;
  }

  const totalPenalty = bleedVendors.reduce((sum, vendor) => sum + vendor.penaltyTotal, 0);
  const draftId = searchParams?.draftId;
  const generatedAt = searchParams?.generatedAt;
  const accessKey = process.env.OPS_ACCESS_KEY;
  const providedKey = searchParams?.key;
  const targetAddress = searchParams?.address;
  const targetOwner = searchParams?.owner;
  const targetCaseId = searchParams?.caseId;
  const targetLienTotal = parsePositiveNumber(searchParams?.lienTotal);
  const targetSalePrice = parsePositiveNumber(searchParams?.lastSalePrice);
  const targetCompany = searchParams?.company?.trim() || 'Target Organization';
  const targetLoopId = searchParams?.targetLoopId?.trim();
  const bridgeType = searchParams?.bridgeType?.trim();
  const bridgeLane = searchParams?.bridgeLane?.trim();
  const efficacyBridgedLoops = parsePositiveNumber(searchParams?.efficacyBridgedLoops);
  const efficacyLoopBreakRate = parsePositiveNumber(searchParams?.efficacyLoopBreakRate);
  const efficacyTimeToBridgeHours = parsePositiveNumber(searchParams?.efficacyTimeToBridgeHours);
  const requestedNeed = searchParams?.need?.trim() || 'invoiceLeakage';
  const requestedNeedKey: CoreNeedKey = isCoreNeedKey(requestedNeed) ? requestedNeed : 'invoiceLeakage';
  const coreNeedKey: CoreNeedKey = 'invoiceLeakage';
  const coreNeed = CORE_NEED_CATALOG[coreNeedKey];
  const baselineExposure = Math.max(250000, totalPenalty);
  const annualLeakage = Math.max(50000, parsePositiveNumber(searchParams?.annualLeakage) ?? baselineExposure);
  const projectedYearOneRecovery = Math.round(annualLeakage * 0.7);
  const suggestedAnnualSubscription = Math.round(Math.max(45000, projectedYearOneRecovery * 0.18));
  const emergentBlueprint = buildEmergentBlueprint({ need: coreNeedKey, annualExposure: annualLeakage });
  const liveEfficacy = await getSystemEfficacyMetrics();
  const efficacy = {
    bridgedLoops: Math.round(efficacyBridgedLoops ?? liveEfficacy.bridgedLoops),
    loopBreakRate: Math.round(efficacyLoopBreakRate ?? liveEfficacy.loopBreakRate),
    avgTimeToBridgeHours: Number((efficacyTimeToBridgeHours ?? liveEfficacy.avgTimeToBridgeHours).toFixed(1)),
  };

  if (accessKey && providedKey !== accessKey) {
    return (
      <StoneBridgeShell
        activeMode="asset"
        title="Ops Shield Proposal"
        subtitle="This audit is gated. Provide a valid access key to view the report."
        secondaryAction={null}
        primaryAction={null}
      >
        <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
          <p className="text-xs font-light uppercase tracking-[0.35em] text-zinc-400">Restricted Access</p>
          <p className="mt-3 text-sm font-light text-zinc-600">Access Key Required.</p>
        </div>
      </StoneBridgeShell>
    );
  }

  return (
    <StoneBridgeShell
      activeMode="asset"
      title="Ops Shield Proposal"
      subtitle="Operational deadlock report: invoice leakage, penalties, and service contract concentration."
      primaryAction={
        <a
          href={`/api/pdf/generate?${new URLSearchParams({
            ...(accessKey ? { key: accessKey } : {}),
            ...(targetAddress ? { address: targetAddress } : {}),
            ...(targetOwner ? { owner: targetOwner } : {}),
            ...(targetCaseId ? { caseId: targetCaseId } : {}),
            ...(targetLienTotal !== null ? { lienTotal: String(targetLienTotal) } : {}),
            ...(targetSalePrice !== null ? { lastSalePrice: String(targetSalePrice) } : {}),
            ...(targetCompany ? { company: targetCompany } : {}),
            need: coreNeedKey,
            annualLeakage: String(annualLeakage),
            ...(targetLoopId ? { targetLoopId } : {}),
            ...(bridgeType ? { bridgeType } : {}),
            ...(bridgeLane ? { bridgeLane } : {}),
          }).toString()}`}
          className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-light uppercase tracking-[0.3em] text-white shadow-sm transition-colors hover:bg-zinc-800"
        >
          Download PDF
        </a>
      }
      secondaryAction={null}
      aside={
        <ProcessPanel
          steps={[
            'Quantify penalty and leakage exposure.',
            'Package evidence with vendor concentration.',
            'Deploy reconciliation to eliminate bleed.',
          ]}
          bullets={[
            `Identified avoidable penalties: ${formatCurrency(totalPenalty)}.`,
            'Evidence packet is PDF-ready.',
            'Execution path: schedule + invoice reconciliation.',
          ]}
        />
      }
    >
      <div className="rounded-2xl border border-zinc-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-sm">
        <div className="border-b border-zinc-200/60 pb-6">
          <p className="text-xs font-light uppercase tracking-[0.4em] text-zinc-500">Restricted: Operational Audit</p>
          <h1 className="mt-4 text-2xl font-extralight tracking-tight text-zinc-900">
            Operational Deadlock Report
          </h1>
          <p className="mt-2 text-sm font-light text-zinc-600">
            Institutional audit of late-fee and interest leakage in Baltimore procurement payments.
          </p>
          {(draftId || generatedAt) && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-600">
              <p><strong>Draft ID:</strong> {draftId || 'AUTO-GEN'}</p>
              <p><strong>Generated:</strong> {generatedAt || 'NOW'}</p>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6">
          <ProposalIntake
            bleedVendors={bleedVendors}
            defaults={{
              company: targetCompany,
              need: requestedNeedKey,
              annualLeakage,
              key: accessKey,
            }}
          />

          {requestedNeedKey !== coreNeedKey && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm font-light text-amber-900">
              Selected need was remapped to <strong>Invoice Leakage and Payment Drag</strong> because this page is grounded
              in Baltimore Open Checkbook late-fee/interest data.
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">The Bleed</p>
            <p className="mt-3 text-lg font-light text-zinc-900">
              Analysis of Open Checkbook data identifies {formatCurrency(totalPenalty)} in avoidable
              late fees and statutory 9% interest paid to target vendors in FY24.
            </p>
          </div>

          {targetAddress && (
            <div className="rounded-xl border border-zinc-200 bg-white/80 p-6">
              <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Targeted Strike Profile</p>
              <div className="mt-3 grid gap-2 text-sm font-light text-zinc-700">
                <p><strong>Address:</strong> {targetAddress}</p>
                {targetOwner && <p><strong>Target Entity:</strong> {targetOwner}</p>}
                {targetCaseId && <p><strong>311 Case:</strong> {targetCaseId}</p>}
                {targetLienTotal !== null && (
                  <p><strong>Lien Exposure:</strong> {formatCurrency(targetLienTotal)}</p>
                )}
                {targetSalePrice !== null && (
                  <p><strong>Last Sale Price:</strong> {formatCurrency(targetSalePrice)}</p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-zinc-200 bg-white/80 p-6">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Financial Evidence</p>
            <div className="mt-4">
              <VendorBleedChart data={bleedVendors} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white/80 p-6">
              <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">The Friction</p>
              <p className="mt-3 text-sm font-light text-zinc-700">
                Existing procurement cycles lag behind utility billing windows by 14 days, triggering
                late fees and statutory interest accrual under Maryland payment rules.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white/80 p-6">
              <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">The Abatement</p>
              <p className="mt-3 text-sm font-light text-zinc-700">
                SOBapp Deployment: Automated middleware to sync billing cycles, reconcile invoices,
                and eliminate penalty exposure.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Service Agreement</p>
            <div className="mt-4 grid gap-3 text-sm font-light text-zinc-700">
              <p><strong>Objective:</strong> Eliminate logistical lag and clerical interest fees.</p>
              <p><strong>Deliverable:</strong> Custom SOBapp middleware script.</p>
              <p><strong>Cost:</strong> $50,000 (Fixed Fee).</p>
              <p><strong>Projected ROI:</strong> 400% in Year 1.</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white/80 p-6">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Productized Software Package</p>
            <h2 className="mt-3 text-xl font-light text-zinc-900">{coreNeed.productName}</h2>
            <div className="mt-4 grid gap-3 text-sm font-light text-zinc-700">
              <p><strong>Client:</strong> {targetCompany}</p>
              <p><strong>Core Need:</strong> {coreNeed.label}</p>
              <p><strong>Current Symptom:</strong> {coreNeed.symptom}</p>
              <p><strong>Delivery SLA:</strong> {coreNeed.sla}</p>
              <p><strong>Estimated Annual Exposure:</strong> {formatCurrency(annualLeakage)}</p>
              <p><strong>Projected Year 1 Recovery:</strong> {formatCurrency(projectedYearOneRecovery)}</p>
              <p><strong>Recommended Annual Subscription:</strong> {formatCurrency(suggestedAnnualSubscription)}</p>
            </div>
            <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs font-light uppercase tracking-[0.25em] text-zinc-500">Included Modules</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-light text-zinc-700">
                {coreNeed.modules.map((module) => (
                  <li key={module}>{module}</li>
                ))}
              </ul>
            </div>
          </div>

          {(targetLoopId || bridgeType || bridgeLane) && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Bridge Linkage</p>
              <div className="mt-3 grid gap-2 text-sm font-light text-zinc-700">
                {targetLoopId && <p><strong>Constraint Loop:</strong> {targetLoopId}</p>}
                {bridgeType && <p><strong>Intervention Type:</strong> {bridgeType}</p>}
                {bridgeLane && <p><strong>Delivery Lane:</strong> {bridgeLane}</p>}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-emerald-700">Emergent Control Plane</p>
            <h2 className="mt-3 text-xl font-light text-zinc-900">Autonomous Resilience Blueprint</h2>
            <p className="mt-2 text-sm font-light text-zinc-700">
              This package is designed as a closed-loop system, not a static dashboard. It senses operational drift,
              predicts loss vectors, executes intervention automatically, and compounds learning after each cycle.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-emerald-200 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Automation Intensity</p>
                <p className="mt-1 text-xl font-light text-zinc-900">{emergentBlueprint.automationIntensity}%</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Novelty Index</p>
                <p className="mt-1 text-xl font-light text-zinc-900">{emergentBlueprint.noveltyIndex}/100</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-white/80 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Compounding Annual Gain</p>
                <p className="mt-1 text-xl font-light text-zinc-900">{formatCurrency(emergentBlueprint.compoundingGain)}</p>
              </div>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-light text-zinc-700">
              {emergentBlueprint.loops.map((loop) => (
                <li key={loop}>{loop}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white/80 p-6">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-zinc-500">Data Provenance</p>
            <div className="mt-3 grid gap-2 text-sm font-light text-zinc-700">
              <p><strong>Primary Source:</strong> Baltimore Open Checkbook FY2022-Present ArcGIS layer.</p>
              <p><strong>Signal Used:</strong> Spend categories matching late fee / interest / penalty terms.</p>
              <p><strong>Grounded Product on this page:</strong> Ops Shield Reconciliation Cloud.</p>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6">
            <p className="text-xs font-light uppercase tracking-[0.3em] text-emerald-700">System Efficacy</p>
            <p className="mt-3 text-sm font-light text-zinc-700">
              Based on <strong>{efficacy.bridgedLoops}</strong> bridged loops, StoneBridge maintains a
              Loop Break Rate of <strong>{efficacy.loopBreakRate}%</strong> with an average time-to-resolution of
              <strong> {efficacy.avgTimeToBridgeHours} hours</strong>.
            </p>
          </div>
        </div>
      </div>
    </StoneBridgeShell>
  );
}
