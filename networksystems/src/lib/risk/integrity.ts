import { createHash } from 'crypto';
import type { RiskFlag } from '@/lib/risk/engine';

type SnapshotPayload = {
  generatedAt: string;
  filters: {
    jurisdiction?: string;
    mode?: string;
    vendor?: string;
  };
  flags: Array<{
    id: string;
    jurisdiction: string;
    agency: string;
    vendor: string;
    severity: string;
    basis: string;
    indicator: string;
    citation: string;
    confidence: number;
    exposure: number;
  }>;
};

function buildPayload(
  flags: RiskFlag[],
  generatedAt: string,
  filters: SnapshotPayload['filters']
): SnapshotPayload {
  const normalized = flags
    .map((f) => ({
      id: f.id,
      jurisdiction: f.jurisdiction,
      agency: f.agency,
      vendor: f.vendor,
      severity: f.severity,
      basis: f.basis,
      indicator: f.indicator,
      citation: f.citation,
      confidence: Number(f.confidence.toFixed(4)),
      exposure: Math.round(f.exposure),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    generatedAt,
    filters,
    flags: normalized,
  };
}

export function generateSnapshotId(
  flags: RiskFlag[],
  generatedAt: string,
  filters: SnapshotPayload['filters'] = {}
): string {
  const payload = buildPayload(flags, generatedAt, filters);
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 12).toUpperCase();
  return `SB-${generatedAt.slice(0, 4)}-${digest}`;
}

