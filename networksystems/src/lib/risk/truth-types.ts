export type AnalystVerdict = 'ACCEPT' | 'REJECT';

export type FlagFingerprint = string;

export type AnalystReview = {
  id: string;
  flagId: string;
  fingerprint: FlagFingerprint;
  ruleId: string;
  verdict: AnalystVerdict;
  reason: string;
  reviewer: string;
  createdAt: string;
};

export type SnapshotFlag = {
  fingerprint: FlagFingerprint;
  flagId: string;
  ruleId: string;
  agency: string;
  vendor: string;
  indicator: string;
  citation: string;
  sourceUrl: string;
  confidence: number;
  exposure: number;
  challengeScore: number;
  logicTrace: string;
};

export type TruthCaseFlag = SnapshotFlag & {
  confidenceBase: number;
  confidenceCalibrated: number;
  calibrationAdjustment: number;
  reviewsForRule: number;
};

export type RiskTruthSnapshot = {
  id: string;
  generatedAt: string;
  stateHash: string;
  flags: SnapshotFlag[];
};

export type RuleCalibration = {
  ruleId: string;
  accepted: number;
  rejected: number;
  reviewed: number;
  acceptanceRate: number;
  adjustment: number;
};

export type TruthStore = {
  snapshots: RiskTruthSnapshot[];
  reviews: AnalystReview[];
  lastUpdatedAt: string;
};

export type SnapshotDiff = {
  added: SnapshotFlag[];
  resolved: SnapshotFlag[];
  changedConfidence: Array<{
    fingerprint: string;
    indicator: string;
    previous: number;
    current: number;
  }>;
  changedExposure: Array<{
    fingerprint: string;
    indicator: string;
    previous: number;
    current: number;
  }>;
};
