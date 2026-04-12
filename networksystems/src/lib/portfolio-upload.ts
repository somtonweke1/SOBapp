import { z } from 'zod';
import type { ForensicReport } from '@/lib/api/forensic-scan';

export const portfolioDealContextOptions = [
  'Acquisition Pipeline',
  'Existing Portfolio',
  'Rehab Planning',
  'Neighborhood Assessment',
] as const;

export const portfolioUploadStatusOptions = ['received', 'processing', 'delivered'] as const;

export const portfolioUploadSchema = z.object({
  institutionName: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email(),
  dealContext: z.enum(portfolioDealContextOptions),
  addresses: z.array(z.string().trim().min(5).max(200)).min(1).max(200),
});

export type PortfolioUploadPayload = z.infer<typeof portfolioUploadSchema>;
export type PortfolioUploadStatus = (typeof portfolioUploadStatusOptions)[number];
export type PortfolioDealContext = (typeof portfolioDealContextOptions)[number];

export type PortfolioUploadResult = {
  address: string;
  report: ForensicReport;
};

export type PortfolioUploadStoredResults = {
  generatedAt: string;
  results: PortfolioUploadResult[];
};

export type PortfolioDecisionBucket = 'proceed' | 'caution' | 'escalate' | 'not_found';

const DIRECTION_TOKENS = new Set(['N', 'S', 'E', 'W', 'NORTH', 'SOUTH', 'EAST', 'WEST']);

export function buildPortfolioUploadReferenceNumber(createdAt: Date) {
  const date = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SB-PO-${date}-${suffix}`;
}

export function parseAddressCsv(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines
    .map((line, index) => {
      const normalized = line.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
      return {
        rowNumber: index + 1,
        address: normalized,
      };
    })
    .filter((row, index) => !(index === 0 && /^address$/i.test(row.address)));

  return rows;
}

export function looksLikeAddress(value: string) {
  const normalized = value.toUpperCase().replace(/\s+/g, ' ').trim();
  if (normalized.length < 8) return false;
  if (!/\d/.test(normalized)) return false;

  const parts = normalized
    .replace(/,/g, ' ')
    .split(' ')
    .filter(Boolean);

  if (parts.length < 2) return false;
  if (!/^\d+[A-Z\-]*$/.test(parts[0] || '')) return false;

  const streetTokens = parts.slice(1).filter((token) => !DIRECTION_TOKENS.has(token));
  return streetTokens.length >= 1;
}

export function normalizeUploadedAddress(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();
}

export function contextToEnum(value: PortfolioDealContext) {
  switch (value) {
    case 'Acquisition Pipeline':
      return 'ACQUISITION_PIPELINE' as const;
    case 'Existing Portfolio':
      return 'EXISTING_PORTFOLIO' as const;
    case 'Rehab Planning':
      return 'REHAB_PLANNING' as const;
    case 'Neighborhood Assessment':
      return 'NEIGHBORHOOD_ASSESSMENT' as const;
  }
}

export function statusToEnum(value: PortfolioUploadStatus) {
  switch (value) {
    case 'processing':
      return 'PROCESSING' as const;
    case 'delivered':
      return 'DELIVERED' as const;
    default:
      return 'RECEIVED' as const;
  }
}

export function statusFromEnum(value: string | null | undefined): PortfolioUploadStatus {
  switch (value) {
    case 'PROCESSING':
      return 'processing';
    case 'DELIVERED':
      return 'delivered';
    default:
      return 'received';
  }
}

export function contextFromEnum(value: string) {
  switch (value) {
    case 'ACQUISITION_PIPELINE':
      return 'Acquisition Pipeline';
    case 'EXISTING_PORTFOLIO':
      return 'Existing Portfolio';
    case 'REHAB_PLANNING':
      return 'Rehab Planning';
    case 'NEIGHBORHOOD_ASSESSMENT':
      return 'Neighborhood Assessment';
    default:
      return value;
  }
}

export function parseStoredPortfolioResults(value: string | null): PortfolioUploadStoredResults | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as PortfolioUploadStoredResults;
  } catch {
    return null;
  }
}

export function percentage(part: number, total: number) {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

export function portfolioDecisionBucket(report: ForensicReport): PortfolioDecisionBucket {
  if (report.status !== 'success') return 'not_found';
  if (report.decision.outcome === 'escalate') return 'escalate';
  if (report.decision.outcome === 'caution') return 'caution';
  return 'proceed';
}
