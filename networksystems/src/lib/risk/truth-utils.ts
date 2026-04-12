import type { RiskFlag } from '@/lib/risk/engine';
import type { SnapshotFlag } from '@/lib/risk/truth-types';

function slug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function quickHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export function buildRuleId(flag: Pick<RiskFlag, 'citationKey' | 'indicator'>): string {
  return `${flag.citationKey}__${slug(flag.indicator).slice(0, 80)}`;
}

export function buildFlagFingerprint(flag: Pick<RiskFlag, 'id' | 'agency' | 'indicator' | 'sourceUrl' | 'citation' | 'vendor'>): string {
  const payload = [flag.id, flag.agency, flag.vendor, flag.indicator, flag.citation, flag.sourceUrl].join('|');
  return `FP-${quickHash(payload)}`;
}

export function toSnapshotFlag(flag: RiskFlag): SnapshotFlag {
  return {
    fingerprint: buildFlagFingerprint(flag),
    flagId: flag.id,
    ruleId: buildRuleId(flag),
    agency: flag.agency,
    vendor: flag.vendor,
    indicator: flag.indicator,
    citation: flag.citation,
    sourceUrl: flag.sourceUrl,
    confidence: Number(flag.confidence.toFixed(4)),
    exposure: Math.round(flag.exposure),
    challengeScore: flag.challengeScore || 0,
    logicTrace: flag.logicTrace,
  };
}

export function buildStateHash(flags: SnapshotFlag[]): string {
  const normalized = flags
    .map((flag) => ({
      fp: flag.fingerprint,
      c: flag.confidence,
      e: flag.exposure,
      s: flag.challengeScore,
    }))
    .sort((a, b) => a.fp.localeCompare(b.fp));
  return `STATE-${quickHash(JSON.stringify(normalized))}`;
}
