import type { ProcurementRecord } from '@/lib/api/procurement-ingest';
import type { RiskFlag } from '@/lib/risk/engine';

export type SprintTask = {
  day: number;
  phase: 'Diagnose' | 'Control Build' | 'Case Remediation' | 'Workflow Install' | 'Closeout';
  objective: string;
  deliverable: string;
};

export type RemediationCase = {
  flagId: string;
  agency: string;
  vendor: string;
  indicator: string;
  basis: RiskFlag['basis'];
  exposure: number;
  confidence: number;
  defensibility: number;
  recommendedControl: string;
  requiredEvidence: string;
  ownerRole: string;
};

export type FixSprintPlan = {
  generatedAt: string;
  objective: string;
  feeBandUsd: string;
  tasks: SprintTask[];
  remediationQueue: RemediationCase[];
  controlModules: string[];
  executiveCloseout: string[];
};

function currencyBand(exposure: number, strictCount: number): string {
  if (exposure >= 5_000_000 || strictCount >= 2) return '$100,000';
  if (exposure >= 1_500_000 || strictCount >= 1) return '$75,000';
  return '$50,000';
}

function controlForFlag(flag: RiskFlag): { control: string; evidence: string; owner: string } {
  if (flag.citationKey === 'COMAR_21_05_06_02A') {
    return {
      control: 'Emergency extension approval gate with 365-day threshold blocker.',
      evidence: 'Signed extension approvals, emergency justification memo, dated board references.',
      owner: 'Procurement Manager',
    };
  }
  if (flag.citationKey === 'COMAR_21_05_05') {
    return {
      control: 'Sole-source market-availability proof workflow with review checkpoint.',
      evidence: 'Market scan memo, alternative vendor checks, sole-source determination file.',
      owner: 'Preconstruction Manager',
    };
  }
  if (flag.citationKey === 'COMAR_21_05_07_05A') {
    return {
      control: 'Anti-splitting monitor across 12-month vendor-entity rollups.',
      evidence: '12-month award rollup, resolved vendor entity map, threshold policy references.',
      owner: 'Chief Estimator',
    };
  }
  return {
    control: 'High-value emergency procurement review workflow.',
    evidence: 'Award memo, urgency rationale, control-owner signoff.',
    owner: 'Procurement Manager',
  };
}

function buildTasks(): SprintTask[] {
  return [
    { day: 1, phase: 'Diagnose', objective: 'Pull current high-risk contracts and extension history.', deliverable: 'Risk scope baseline' },
    { day: 2, phase: 'Diagnose', objective: 'Map root-control failures by citation/rule.', deliverable: 'Failure map with owners' },
    { day: 3, phase: 'Control Build', objective: 'Implement emergency-term threshold rules and blockers.', deliverable: 'Extension-control module v1' },
    { day: 4, phase: 'Control Build', objective: 'Implement sole-source documentation gates.', deliverable: 'Sole-source control checklist' },
    { day: 5, phase: 'Control Build', objective: 'Implement split-pattern detector and vendor rollup checks.', deliverable: 'Anti-splitting monitor v1' },
    { day: 6, phase: 'Control Build', objective: 'Connect controls to escalation routing and audit trail.', deliverable: 'Control-to-escalation workflow' },
    { day: 7, phase: 'Case Remediation', objective: 'Triage top exposure cases and assign owners.', deliverable: 'Priority remediation queue' },
    { day: 8, phase: 'Case Remediation', objective: 'Resolve evidence gaps for strict-law findings.', deliverable: 'Evidence completion packet' },
    { day: 9, phase: 'Case Remediation', objective: 'Issue decision status (Proceed/Caution/Escalate) per case.', deliverable: 'Case disposition ledger' },
    { day: 10, phase: 'Case Remediation', objective: 'Finalize corrective controls per high-risk case.', deliverable: 'Case-by-case corrective actions' },
    { day: 11, phase: 'Workflow Install', objective: 'Install SOPs for procurement/compliance/legal handoff.', deliverable: 'Operating SOP set' },
    { day: 12, phase: 'Workflow Install', objective: 'Train owners on control usage and evidence standards.', deliverable: 'Owner adoption checklist' },
    { day: 13, phase: 'Workflow Install', objective: 'Run dry-run on upcoming bid/subcontract decisions.', deliverable: 'Readiness test report' },
    { day: 14, phase: 'Closeout', objective: 'Deliver executive summary and 30-day follow-up plan.', deliverable: 'Executive closeout memo' },
  ];
}

export function buildFixSprintPlan(records: ProcurementRecord[], flags: RiskFlag[]): FixSprintPlan {
  const totalExposure = flags.reduce((sum, f) => sum + f.exposure, 0);
  const strictCount = flags.filter((f) => f.basis === 'STRICT_LAW').length;

  const remediationQueue = [...flags]
    .sort((a, b) => b.exposure - a.exposure)
    .slice(0, 12)
    .map((flag) => {
      const control = controlForFlag(flag);
      return {
        flagId: flag.id,
        agency: flag.agency,
        vendor: flag.vendor,
        indicator: flag.indicator,
        basis: flag.basis,
        exposure: flag.exposure,
        confidence: flag.confidence,
        defensibility: flag.challengeScore || 0,
        recommendedControl: control.control,
        requiredEvidence: control.evidence,
        ownerRole: control.owner,
      };
    });

  const controlModules = Array.from(new Set(remediationQueue.map((c) => c.recommendedControl)));

  return {
    generatedAt: new Date().toISOString(),
    objective: 'Implement emergency-term and procurement-risk controls in 14 days with measurable remediation output.',
    feeBandUsd: currencyBand(totalExposure, strictCount),
    tasks: buildTasks(),
    remediationQueue,
    controlModules,
    executiveCloseout: [
      `Reviewed ${records.length} procurement records and ${flags.length} active risk findings.`,
      `Prioritized ${remediationQueue.length} cases for immediate control remediation.`,
      'Delivered control modules, owner assignments, and evidence standards for ongoing operations.',
      'Produced 30-day monitoring plan and escalation governance cadence.',
    ],
  };
}
