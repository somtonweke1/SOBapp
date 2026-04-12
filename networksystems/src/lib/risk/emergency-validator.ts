import type { ProcurementRecord } from '@/lib/api/procurement-ingest';

export type ValidatorStatus = 'GREEN' | 'AMBER' | 'RED';

export type ValidatorCheck = {
  key: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  citation: string;
};

export type EmergencyValidationResult = {
  recordId: string;
  agency: string;
  vendor: string;
  category: string;
  amount: number;
  jurisdiction: ProcurementRecord['jurisdiction'];
  sourceUrl: string;
  boardActionDate?: string;
  status: ValidatorStatus;
  score: number;
  checks: ValidatorCheck[];
  matchedContracts: Array<{ recordId: string; vendor: string; method: string; sourceUrl: string }>;
  requiredEvidence: string[];
};

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function normalize(text?: string): string {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function methodCitation(jurisdiction: ProcurementRecord['jurisdiction']): string {
  if (jurisdiction === 'Maryland State') return 'COMAR 21.05.06.02(A)';
  return 'Baltimore City Charter Art. VI, §11';
}

function overlapCategory(a?: string, b?: string): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

function scoreChecks(checks: ValidatorCheck[]): number {
  const total = checks.reduce((sum, c) => {
    if (c.status === 'PASS') return sum + 1;
    if (c.status === 'WARN') return sum + 0.5;
    return sum;
  }, 0);
  return Math.round((total / Math.max(1, checks.length)) * 100);
}

function toStatus(checks: ValidatorCheck[], score: number): ValidatorStatus {
  if (checks.some((c) => c.status === 'FAIL')) return 'RED';
  if (score < 80 || checks.some((c) => c.status === 'WARN')) return 'AMBER';
  return 'GREEN';
}

function findMatchedContracts(record: ProcurementRecord, records: ProcurementRecord[]) {
  const start = new Date(record.startDate);
  return records
    .filter((candidate) => {
      if (candidate.id === record.id) return false;
      if (candidate.agency !== record.agency) return false;
      if (candidate.method === 'Emergency') return false;
      if (!overlapCategory(record.category, candidate.category)) return false;
      if (!candidate.currentEndDate) return true;
      const end = new Date(candidate.currentEndDate);
      return !Number.isNaN(end.getTime()) && !Number.isNaN(start.getTime()) && end.getTime() >= start.getTime();
    })
    .slice(0, 5)
    .map((candidate) => ({
      recordId: candidate.id,
      vendor: candidate.canonicalVendorName || candidate.vendor,
      method: candidate.method,
      sourceUrl: candidate.sourceUrl,
    }));
}

export function buildEmergencyValidation(records: ProcurementRecord[]): EmergencyValidationResult[] {
  const emergencyRecords = records.filter((record) => record.method === 'Emergency');

  return emergencyRecords.map((record) => {
    const citation = methodCitation(record.jurisdiction);
    const checks: ValidatorCheck[] = [];
    const evidenceText = (record.sourceEvidence || []).map((item) => item.excerpt).join(' ').trim();
    const matchedContracts = findMatchedContracts(record, records);

    checks.push({
      key: 'reason_evidence',
      status: evidenceText.length >= 40 ? 'PASS' : evidenceText.length > 0 ? 'WARN' : 'FAIL',
      message: evidenceText.length > 0 ? 'Emergency rationale evidence exists.' : 'No emergency rationale evidence excerpt found.',
      citation,
    });

    const boardDate = record.boardActionDate ? new Date(record.boardActionDate) : null;
    const startDate = new Date(record.startDate);
    const dateDiffValid =
      boardDate && !Number.isNaN(boardDate.getTime()) && !Number.isNaN(startDate.getTime())
        ? daysBetween(boardDate, startDate)
        : null;

    checks.push({
      key: 'timing_alignment',
      status: dateDiffValid === null ? 'WARN' : dateDiffValid <= 14 ? 'PASS' : 'WARN',
      message:
        dateDiffValid === null
          ? 'Missing board/start timing to validate urgency window.'
          : `Board/start timing delta: ${dateDiffValid} day(s).`,
      citation,
    });

    checks.push({
      key: 'existing_contract_crosscheck',
      status: matchedContracts.length > 0 ? 'FAIL' : 'PASS',
      message:
        matchedContracts.length > 0
          ? `Found ${matchedContracts.length} potentially applicable non-emergency contract(s).`
          : 'No applicable active non-emergency contract found.',
      citation,
    });

    checks.push({
      key: 'source_url',
      status: /^https?:\/\//.test(record.sourceUrl) ? 'PASS' : 'FAIL',
      message: record.sourceUrl || 'Missing source URL',
      citation,
    });

    const score = scoreChecks(checks);
    const status = toStatus(checks, score);

    const requiredEvidence = [
      'Emergency justification memo with service-impact narrative',
      'Board authorization reference and approval timestamp',
      'Proof no active contract could satisfy the request (or documented exception)',
    ];

    return {
      recordId: record.id,
      agency: record.agency,
      vendor: record.canonicalVendorName || record.vendor,
      category: record.category || 'Unspecified',
      amount: record.amount,
      jurisdiction: record.jurisdiction,
      sourceUrl: record.sourceUrl,
      boardActionDate: record.boardActionDate,
      status,
      score,
      checks,
      matchedContracts,
      requiredEvidence,
    };
  });
}
