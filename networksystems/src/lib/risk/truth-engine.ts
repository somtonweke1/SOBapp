import 'server-only';

import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk, type RiskFlag } from '@/lib/risk/engine';
import { appendSnapshot, computePrecisionTopFlags, diffSnapshots, getRejectedFalsePositives, getRuleCalibrations, loadTruthStore } from '@/lib/risk/truth-store';
import { buildRuleId, buildStateHash, toSnapshotFlag } from '@/lib/risk/truth-utils';
import type { RuleCalibration, TruthCaseFlag } from '@/lib/risk/truth-types';

export type MarylandTruthCaseReport = {
  generatedAt: string;
  elapsedMs: number;
  useCase: {
    user: string;
    job: string;
    output: string;
  };
  wowGates: {
    timeToBriefMinutes: number;
    meetsTimeGate: boolean;
    precisionTopFlags: number | null;
    reviewedTopFlags: number;
    meetsPrecisionGate: boolean | null;
    traceabilityCoverage: number;
    meetsTraceabilityGate: boolean;
    oneClickExportReady: boolean;
  };
  summary: {
    records: number;
    findings: number;
    strictLaw: number;
    heuristics: number;
    highExposure: number;
  };
  snapshot: {
    id: string;
    stateHash: string;
    previousId: string | null;
    changes: {
      added: number;
      resolved: number;
      confidenceChanged: number;
      exposureChanged: number;
    };
    whyItMatters: string[];
  };
  calibrations: RuleCalibration[];
  topFlags: TruthCaseFlag[];
  rejectedFalsePositives: Array<{
    fingerprint: string;
    ruleId: string;
    reason: string;
    reviewer: string;
    createdAt: string;
  }>;
};

function applyCalibrations(flags: RiskFlag[], calibrations: RuleCalibration[]): TruthCaseFlag[] {
  const byRule = new Map(calibrations.map((item) => [item.ruleId, item]));
  const normalized = flags.map(toSnapshotFlag);
  return normalized.map((item) => {
    const calibration = byRule.get(item.ruleId);
    const confidenceBase = item.confidence;
    const adjustment = calibration?.adjustment || 0;
    const confidenceCalibrated = Math.max(0.05, Math.min(0.99, confidenceBase + adjustment));
    return {
      ...item,
      confidence: Number(confidenceCalibrated.toFixed(4)),
      confidenceBase: Number(confidenceBase.toFixed(4)),
      confidenceCalibrated: Number(confidenceCalibrated.toFixed(4)),
      calibrationAdjustment: Number(adjustment.toFixed(4)),
      reviewsForRule: calibration?.reviewed || 0,
    };
  });
}

function traceabilityCoverage(flags: TruthCaseFlag[]): number {
  if (flags.length === 0) return 1;
  const complete = flags.filter(
    (flag) => Boolean(flag.sourceUrl && flag.citation && flag.logicTrace && flag.ruleId)
  ).length;
  return Number((complete / flags.length).toFixed(4));
}

function buildWhyItMatters(changes: MarylandTruthCaseReport['snapshot']['changes']): string[] {
  const items: string[] = [];
  if (changes.added > 0) {
    items.push(`${changes.added} new risk signals entered scope and require triage before the next review cycle.`);
  }
  if (changes.resolved > 0) {
    items.push(`${changes.resolved} previous signals are no longer present, which changes follow-up priorities.`);
  }
  if (changes.confidenceChanged > 0) {
    items.push(`${changes.confidenceChanged} signals changed confidence after analyst feedback calibration.`);
  }
  if (changes.exposureChanged > 0) {
    items.push(`${changes.exposureChanged} signals changed exposure values and should be re-ranked.`);
  }
  if (items.length === 0) {
    items.push('No material state change versus the latest stored snapshot.');
  }
  return items;
}

export async function runMarylandProcurementTruthCase(): Promise<MarylandTruthCaseReport> {
  const started = Date.now();
  const generatedAt = new Date().toISOString();

  const records = await ingestProcurementData();
  const baseFlags = analyzePortfolioRisk(records);
  const calibrations = getRuleCalibrations();
  const calibrated = applyCalibrations(baseFlags, calibrations);
  const ranked = [...calibrated].sort((a, b) => b.exposure - a.exposure);

  const stateHash = buildStateHash(ranked);
  const snapshotId = `TRUTH-${generatedAt.slice(0, 10)}-${stateHash.replace('STATE-', '')}`;
  const persisted = appendSnapshot({
    id: snapshotId,
    generatedAt,
    stateHash,
    flags: ranked,
  });

  const diff = diffSnapshots(persisted.previous, persisted.snapshot);
  const precision = computePrecisionTopFlags(ranked, 10);
  const coverage = traceabilityCoverage(ranked);
  const elapsedMs = Date.now() - started;

  const strictLaw = baseFlags.filter((flag) => flag.basis === 'STRICT_LAW').length;
  const heuristics = baseFlags.filter((flag) => flag.basis === 'RISK_HEURISTIC').length;
  const highExposure = ranked
    .filter((flag) => flag.challengeScore >= 60)
    .reduce((sum, flag) => sum + flag.exposure, 0);

  return {
    generatedAt,
    elapsedMs,
    useCase: {
      user: 'Maryland procurement analyst preparing board/hearing briefs',
      job: 'Find and document high-confidence procurement risk signals with evidence traceability.',
      output: 'Decision-grade risk brief with citations, reproducible logic, and export-ready dossier.',
    },
    wowGates: {
      timeToBriefMinutes: Number((elapsedMs / 60000).toFixed(2)),
      meetsTimeGate: elapsedMs < 10 * 60 * 1000,
      precisionTopFlags: precision.precision,
      reviewedTopFlags: precision.reviewed,
      meetsPrecisionGate: precision.precision === null ? null : precision.precision >= 0.8,
      traceabilityCoverage: coverage,
      meetsTraceabilityGate: coverage === 1,
      oneClickExportReady: true,
    },
    summary: {
      records: records.length,
      findings: ranked.length,
      strictLaw,
      heuristics,
      highExposure: Math.round(highExposure),
    },
    snapshot: {
      id: persisted.snapshot.id,
      stateHash: persisted.snapshot.stateHash,
      previousId: persisted.previous?.id || null,
      changes: {
        added: diff.added.length,
        resolved: diff.resolved.length,
        confidenceChanged: diff.changedConfidence.length,
        exposureChanged: diff.changedExposure.length,
      },
      whyItMatters: buildWhyItMatters({
        added: diff.added.length,
        resolved: diff.resolved.length,
        confidenceChanged: diff.changedConfidence.length,
        exposureChanged: diff.changedExposure.length,
      }),
    },
    calibrations: calibrations.sort((a, b) => b.reviewed - a.reviewed).slice(0, 12),
    topFlags: ranked.slice(0, 15),
    rejectedFalsePositives: getRejectedFalsePositives(8).map((item) => ({
      fingerprint: item.fingerprint,
      ruleId: item.ruleId,
      reason: item.reason,
      reviewer: item.reviewer,
      createdAt: item.createdAt,
    })),
  };
}

export function getRuleIdForFlag(flag: Pick<RiskFlag, 'citationKey' | 'indicator'>): string {
  return buildRuleId(flag);
}

export function getCurrentReviewStats(): { totalReviews: number } {
  return { totalReviews: loadTruthStore().reviews.length };
}
