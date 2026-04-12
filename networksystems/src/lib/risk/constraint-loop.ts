import type { RiskFlag } from '@/lib/risk/engine';

export type ConstraintLoopType = 'REGULATOR_PROCESS' | 'FINANCIAL' | 'ENTITY_OPACITY' | 'COMPLIANCE';
export type ConstraintLoopStatus = 'ACTIVE' | 'BRIDGED' | 'BROKEN';
export type BridgeInterventionType = 'PROCESS' | 'DATA' | 'CONTROL';
export type BridgeInterventionStatus = 'PROPOSED' | 'DEPLOYED' | 'COMPLETED' | 'FAILED';

export type BridgePlaybookStep = {
  id: string;
  title: string;
  owner: string;
  outcome: string;
};

export type ConstraintLoop = {
  id: string;
  signature: string;
  type: ConstraintLoopType;
  vendor: string;
  agency: string;
  jurisdiction: RiskFlag['jurisdiction'];
  signals: RiskFlag[];
  tensionScore: number;
  status: ConstraintLoopStatus;
  exposure: number;
  createdAt: string;
  updatedAt: string;
};

export type BridgeIntervention = {
  id: string;
  type: BridgeInterventionType;
  status: BridgeInterventionStatus;
  targetLoopId: string;
  targetLoopSignature: string;
  lane: 'Risk Feed' | 'Entity Intelligence' | 'Fix Sprint';
  playbookSteps: BridgePlaybookStep[];
  expectedDelta: number;
  actualDelta: number | null;
  createdAt: string;
  deployedAt: string | null;
  completedAt: string | null;
  timeToBridgeHours: number | null;
};

function slug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function severityWeight(severity: RiskFlag['severity']): number {
  if (severity === 'HIGH') return 3;
  if (severity === 'MEDIUM') return 2;
  return 1;
}

const BALTIMORE_ZIP_RE = /^21\d{3}$/;

function isBaltimoreUtilitySignal(signal: RiskFlag): boolean {
  const corpus = `${signal.indicator} ${signal.citation} ${signal.logicTrace || ''}`.toLowerCase();
  return signal.jurisdiction === 'Baltimore City' &&
    (signal.dataLane === 'BALTIMORE_UTILITY_LEAKAGE' || /(utility|water|sewer|leakage|late fee|interest|penalty)/.test(corpus)) &&
    (!!signal.zipCode && BALTIMORE_ZIP_RE.test(signal.zipCode));
}

function detectLoopType(signals: RiskFlag[]): ConstraintLoopType {
  const hasBaltimoreUtility = signals.some((signal) => isBaltimoreUtilitySignal(signal));
  if (hasBaltimoreUtility) {
    const strictShare = signals.filter((signal) => signal.basis === 'STRICT_LAW').length / Math.max(1, signals.length);
    return strictShare >= 0.4 ? 'REGULATOR_PROCESS' : 'FINANCIAL';
  }
  const corpus = signals.map((signal) => `${signal.indicator} ${signal.citation}`.toLowerCase()).join(' ');
  if (/(late fee|interest|penalty|invoice|billing|payment|leakage)/.test(corpus)) return 'FINANCIAL';
  if (/(entity|alias|masking|identity|parent|subsidiary|affiliate|ownership)/.test(corpus)) return 'ENTITY_OPACITY';
  if (/(emergency|sole source|split|charter|comar)/.test(corpus)) return 'REGULATOR_PROCESS';
  return 'COMPLIANCE';
}

export function calculateLoopTension(params: {
  impact: number;
  severity: number;
  regulatoryRisk: number;
  interventionEfficiency: number;
}): number {
  const denominator = Math.max(0.5, params.interventionEfficiency);
  return Number((((params.impact * params.severity) + params.regulatoryRisk) / denominator).toFixed(2));
}

export function buildConstraintLoops(
  flags: RiskFlag[],
  interventionHistoryBySignature: Record<string, number> = {},
  statusBySignature: Record<string, ConstraintLoopStatus> = {}
): ConstraintLoop[] {
  const nowIso = new Date().toISOString();
  const grouped = new Map<string, RiskFlag[]>();

  for (const flag of flags) {
    const vendor = (flag.vendor || 'unknown-vendor').trim();
    const typeHint = detectLoopType([flag]);
    const signature = `${vendor}::${typeHint}`;
    const current = grouped.get(signature) || [];
    current.push(flag);
    grouped.set(signature, current);
  }

  return [...grouped.entries()]
    .map(([signature, signals]) => {
      const highestSeverity = Math.max(1, ...signals.map((signal) => severityWeight(signal.severity)));
      const type = detectLoopType(signals);
      const history = (interventionHistoryBySignature[signature] || 0) + 1;
      const exposure = signals.reduce((sum, signal) => {
        const value = Number(signal.exposure);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0);
      const impact = Math.max(1, Math.log10(exposure + 10));
      const strictShare = signals.filter((signal) => signal.basis === 'STRICT_LAW').length / Math.max(1, signals.length);
      const baltimoreUtilityBoost = signals.some((signal) => isBaltimoreUtilitySignal(signal)) ? 2.25 : 1;
      const regulatoryRisk = Number((strictShare * 5 * baltimoreUtilityBoost).toFixed(2));
      const interventionEfficiency = Number((1 + history * 0.25).toFixed(2));
      const seed = slug(signature);
      const computedTension = calculateLoopTension({
        impact,
        severity: highestSeverity,
        regulatoryRisk,
        interventionEfficiency,
      });
      return {
        id: `loop-${seed}`,
        signature,
        type,
        vendor: signals[0]?.vendor || 'Unknown Vendor',
        agency: signals[0]?.agency || 'Unknown Agency',
        jurisdiction: signals[0]?.jurisdiction || 'Maryland State',
        signals,
        tensionScore: Number.isFinite(computedTension) ? computedTension : 0,
        status: statusBySignature[signature] || 'ACTIVE',
        exposure,
        createdAt: nowIso,
        updatedAt: nowIso,
      } satisfies ConstraintLoop;
    })
    .sort((a, b) => b.tensionScore - a.tensionScore);
}

export function matchBridgeToLoop(loop: ConstraintLoop): BridgeIntervention {
  return matchBridgeToLoopWithLearning(loop, {});
}

export function matchBridgeToLoopWithLearning(
  loop: ConstraintLoop,
  learningByType: Partial<Record<BridgeInterventionType, number>>
): BridgeIntervention {
  const nowIso = new Date().toISOString();
  const withLearning = (base: number, type: BridgeInterventionType) =>
    Math.round(base * Math.max(0.7, Math.min(1.35, learningByType[type] || 1)));

  if (loop.type === 'FINANCIAL') {
    return {
      id: `bridge-${slug(loop.signature)}-financial`,
      type: 'PROCESS',
      status: 'PROPOSED',
      targetLoopId: loop.id,
      targetLoopSignature: loop.signature,
      lane: 'Fix Sprint',
      playbookSteps: [
        { id: 'f-1', title: 'Normalize invoice and payment event stream', owner: 'Data Ops', outcome: 'Unified billing timeline' },
        { id: 'f-2', title: 'Predict penalty windows + route exceptions', owner: 'Ops Control', outcome: 'Early intervention before fee accrual' },
        { id: 'f-3', title: 'Auto-reconcile disputed line items', owner: 'Finance Ops', outcome: 'Reduced avoidable leakage' },
      ],
      expectedDelta: withLearning(loop.exposure * 0.35, 'PROCESS'),
      actualDelta: null,
      createdAt: nowIso,
      deployedAt: null,
      completedAt: null,
      timeToBridgeHours: null,
    };
  }

  if (loop.type === 'ENTITY_OPACITY') {
    return {
      id: `bridge-${slug(loop.signature)}-entity`,
      type: 'DATA',
      status: 'PROPOSED',
      targetLoopId: loop.id,
      targetLoopSignature: loop.signature,
      lane: 'Entity Intelligence',
      playbookSteps: [
        { id: 'e-1', title: 'Resolve aliases into master entities', owner: 'Resolution Engine', outcome: 'Clean vendor identity map' },
        { id: 'e-2', title: 'Expand ownership/affiliate graph', owner: 'Graph Service', outcome: 'Hidden control paths exposed' },
        { id: 'e-3', title: 'Attach legal basis to high-risk nodes', owner: 'Compliance', outcome: 'Actionable escalation dossier' },
      ],
      expectedDelta: withLearning(loop.exposure * 0.25, 'DATA'),
      actualDelta: null,
      createdAt: nowIso,
      deployedAt: null,
      completedAt: null,
      timeToBridgeHours: null,
    };
  }

  if (loop.type === 'REGULATOR_PROCESS') {
    return {
      id: `bridge-${slug(loop.signature)}-regulator`,
      type: 'CONTROL',
      status: 'PROPOSED',
      targetLoopId: loop.id,
      targetLoopSignature: loop.signature,
      lane: 'Risk Feed',
      playbookSteps: [
        { id: 'r-1', title: 'Map statute constraints to process checkpoints', owner: 'Policy Engine', outcome: 'Pre-execution compliance gates' },
        { id: 'r-2', title: 'Auto-flag nonconforming procurement flows', owner: 'Risk Feed', outcome: 'Reduced exposure to strict-law failures' },
        { id: 'r-3', title: 'Escalate unresolved pathways to Fix Sprint', owner: 'Operations', outcome: 'Closed-loop remediation path' },
      ],
      expectedDelta: withLearning(loop.exposure * 0.28, 'CONTROL'),
      actualDelta: null,
      createdAt: nowIso,
      deployedAt: null,
      completedAt: null,
      timeToBridgeHours: null,
    };
  }

  return {
    id: `bridge-${slug(loop.signature)}-compliance`,
    type: 'CONTROL',
    status: 'PROPOSED',
    targetLoopId: loop.id,
    targetLoopSignature: loop.signature,
    lane: 'Risk Feed',
    playbookSteps: [
      { id: 'c-1', title: 'Consolidate risk signals into execution lanes', owner: 'Signal Ops', outcome: 'Unified control context' },
      { id: 'c-2', title: 'Deploy policy simulation before approvals', owner: 'Compliance Ops', outcome: 'Pre-breach detection' },
      { id: 'c-3', title: 'Capture adjudication feedback into rules', owner: 'Learning Loop', outcome: 'Adaptive control improvement' },
    ],
    expectedDelta: withLearning(loop.exposure * 0.22, 'CONTROL'),
    actualDelta: null,
    createdAt: nowIso,
    deployedAt: null,
    completedAt: null,
    timeToBridgeHours: null,
  };
}

export function computeLoopMetrics(loops: ConstraintLoop[], completedInterventions: BridgeIntervention[]) {
  const bridgedCount = loops.filter((loop) => loop.status === 'BRIDGED').length;
  const total = loops.length;
  const breakRate = total === 0 ? 0 : Math.round((bridgedCount / total) * 100);

  const completedWithTime = completedInterventions.filter(
    (intervention) => intervention.status === 'COMPLETED' && typeof intervention.timeToBridgeHours === 'number'
  );
  const avgTimeToBridgeHours = completedWithTime.length === 0
    ? 0
    : Number(
        (
          completedWithTime.reduce((sum, intervention) => sum + (intervention.timeToBridgeHours || 0), 0) /
          completedWithTime.length
        ).toFixed(1)
      );

  return {
    loopBreakRate: breakRate,
    timeToBridgeHours: avgTimeToBridgeHours,
    bridgedCount,
    totalLoops: total,
  };
}
