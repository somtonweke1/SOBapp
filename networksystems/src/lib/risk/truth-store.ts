import 'server-only';

import fs from 'fs';
import path from 'path';
import type { AnalystReview, RiskTruthSnapshot, RuleCalibration, SnapshotDiff, SnapshotFlag, TruthStore } from '@/lib/risk/truth-types';

const TRUTH_STORE_PATH = path.join(process.cwd(), 'data', 'risk-truth-store.json');
const MAX_SNAPSHOTS = 120;
let memoryStore: TruthStore | null = null;

const DEFAULT_STORE: TruthStore = {
  snapshots: [],
  reviews: [],
  lastUpdatedAt: new Date(0).toISOString(),
};

function ensureStoreDir(): void {
  const dir = path.dirname(TRUTH_STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function normalizeStore(store: TruthStore): TruthStore {
  return {
    snapshots: store.snapshots || [],
    reviews: store.reviews || [],
    lastUpdatedAt: store.lastUpdatedAt || new Date().toISOString(),
  };
}

export function loadTruthStore(): TruthStore {
  try {
    if (!fs.existsSync(TRUTH_STORE_PATH)) return DEFAULT_STORE;
    const raw = fs.readFileSync(TRUTH_STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as TruthStore;
    const normalized = normalizeStore(parsed);
    memoryStore = normalized;
    return normalized;
  } catch {
    if (memoryStore) return memoryStore;
    return DEFAULT_STORE;
  }
}

export function saveTruthStore(store: TruthStore): void {
  const next: TruthStore = {
    ...store,
    snapshots: [...store.snapshots].slice(-MAX_SNAPSHOTS),
    reviews: [...store.reviews].slice(-1500),
    lastUpdatedAt: new Date().toISOString(),
  };
  memoryStore = next;
  try {
    ensureStoreDir();
    fs.writeFileSync(TRUTH_STORE_PATH, JSON.stringify(next, null, 2));
  } catch {
    // Serverless/read-only filesystem fallback: keep process-local memory state.
  }
}

export function appendSnapshot(snapshot: RiskTruthSnapshot): {
  snapshot: RiskTruthSnapshot;
  previous: RiskTruthSnapshot | null;
  changed: boolean;
} {
  const store = loadTruthStore();
  const previous = store.snapshots[store.snapshots.length - 1] || null;
  const alreadyPresent = store.snapshots.some((item) => item.stateHash === snapshot.stateHash);

  if (!alreadyPresent) {
    store.snapshots.push(snapshot);
    saveTruthStore(store);
    return { snapshot, previous, changed: true };
  }

  const existing = store.snapshots.find((item) => item.stateHash === snapshot.stateHash) || snapshot;
  return { snapshot: existing, previous, changed: false };
}

export function recordReview(input: Omit<AnalystReview, 'id' | 'createdAt'>): AnalystReview {
  const store = loadTruthStore();
  const review: AnalystReview = {
    ...input,
    id: `RVW-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };

  // Keep latest reviewer verdict for a fingerprint/rule pair.
  const withoutDuplicate = store.reviews.filter(
    (item) => !(item.reviewer === review.reviewer && item.fingerprint === review.fingerprint && item.ruleId === review.ruleId)
  );
  withoutDuplicate.push(review);
  store.reviews = withoutDuplicate;
  saveTruthStore(store);
  return review;
}

export function getRuleCalibrations(): RuleCalibration[] {
  const store = loadTruthStore();
  const byRule = new Map<string, { accepted: number; rejected: number }>();

  for (const review of store.reviews) {
    const current = byRule.get(review.ruleId) || { accepted: 0, rejected: 0 };
    if (review.verdict === 'ACCEPT') current.accepted += 1;
    if (review.verdict === 'REJECT') current.rejected += 1;
    byRule.set(review.ruleId, current);
  }

  return [...byRule.entries()].map(([ruleId, totals]) => {
    // Beta prior (2, 1) biases toward precision until reviews accumulate.
    const acceptanceRate = (totals.accepted + 2) / (totals.accepted + totals.rejected + 3);
    // Map acceptance rate to conservative confidence adjustment in [-0.15, +0.15].
    const adjustment = Math.max(-0.15, Math.min(0.15, (acceptanceRate - 0.7) * 0.5));
    return {
      ruleId,
      accepted: totals.accepted,
      rejected: totals.rejected,
      reviewed: totals.accepted + totals.rejected,
      acceptanceRate: Number(acceptanceRate.toFixed(4)),
      adjustment: Number(adjustment.toFixed(4)),
    };
  });
}

export function computePrecisionTopFlags(flags: SnapshotFlag[], topN = 10): {
  precision: number | null;
  reviewed: number;
  accepted: number;
  rejected: number;
} {
  const top = [...flags].sort((a, b) => b.exposure - a.exposure).slice(0, topN);
  const fingerprints = new Set(top.map((item) => item.fingerprint));
  const reviews = loadTruthStore().reviews.filter((item) => fingerprints.has(item.fingerprint));

  const latestByFingerprint = new Map<string, AnalystReview>();
  for (const review of reviews.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    latestByFingerprint.set(review.fingerprint, review);
  }

  const latest = [...latestByFingerprint.values()];
  const accepted = latest.filter((item) => item.verdict === 'ACCEPT').length;
  const rejected = latest.filter((item) => item.verdict === 'REJECT').length;
  const reviewed = accepted + rejected;

  return {
    precision: reviewed === 0 ? null : Number((accepted / reviewed).toFixed(4)),
    reviewed,
    accepted,
    rejected,
  };
}

export function getRejectedFalsePositives(limit = 5): AnalystReview[] {
  return loadTruthStore()
    .reviews
    .filter((item) => item.verdict === 'REJECT')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

function mapByFingerprint(flags: SnapshotFlag[]): Map<string, SnapshotFlag> {
  return new Map(flags.map((flag) => [flag.fingerprint, flag]));
}

export function diffSnapshots(previous: RiskTruthSnapshot | null, current: RiskTruthSnapshot): SnapshotDiff {
  if (!previous) {
    return {
      added: current.flags,
      resolved: [],
      changedConfidence: [],
      changedExposure: [],
    };
  }

  const prevMap = mapByFingerprint(previous.flags);
  const currMap = mapByFingerprint(current.flags);

  const added: SnapshotFlag[] = [];
  const resolved: SnapshotFlag[] = [];
  const changedConfidence: SnapshotDiff['changedConfidence'] = [];
  const changedExposure: SnapshotDiff['changedExposure'] = [];

  for (const flag of current.flags) {
    const prev = prevMap.get(flag.fingerprint);
    if (!prev) {
      added.push(flag);
      continue;
    }
    if (Math.abs(prev.confidence - flag.confidence) >= 0.01) {
      changedConfidence.push({
        fingerprint: flag.fingerprint,
        indicator: flag.indicator,
        previous: prev.confidence,
        current: flag.confidence,
      });
    }
    if (Math.abs(prev.exposure - flag.exposure) >= 1) {
      changedExposure.push({
        fingerprint: flag.fingerprint,
        indicator: flag.indicator,
        previous: prev.exposure,
        current: flag.exposure,
      });
    }
  }

  for (const flag of previous.flags) {
    if (!currMap.has(flag.fingerprint)) resolved.push(flag);
  }

  return {
    added,
    resolved,
    changedConfidence,
    changedExposure,
  };
}
