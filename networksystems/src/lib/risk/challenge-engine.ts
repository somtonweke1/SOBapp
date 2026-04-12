import type { ProcurementRecord } from '@/lib/api/procurement-ingest';
import type { RiskFlag } from '@/lib/risk/engine';

export type ChallengeStatus = 'PASS' | 'WARN' | 'FAIL';

export type ChallengeCheck = {
  key: string;
  status: ChallengeStatus;
  question: string;
  rationale: string;
};

export type ChallengeResult = {
  flagId: string;
  score: number;
  disposition: 'DEFENSIBLE' | 'NEEDS_REVIEW' | 'WEAK_SIGNAL';
  checks: ChallengeCheck[];
};

function scoreCheck(status: ChallengeStatus): number {
  if (status === 'PASS') return 1;
  if (status === 'WARN') return 0.5;
  return 0;
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function runChallengeEngine(flag: RiskFlag, record?: ProcurementRecord): ChallengeResult {
  const checks: ChallengeCheck[] = [];

  checks.push({
    key: 'source_url',
    status: flag.sourceUrl.startsWith('http') ? 'PASS' : 'FAIL',
    question: 'Can this finding be traced to a primary source URL?',
    rationale: flag.sourceUrl,
  });

  checks.push({
    key: 'citation_binding',
    status: flag.citation && flag.citationKey ? 'PASS' : 'FAIL',
    question: 'Is the finding mapped to a specific statutory citation?',
    rationale: `${flag.citation} (${flag.citationKey})`,
  });

  if (!record) {
    checks.push({
      key: 'record_binding',
      status: 'WARN',
      question: 'Is there a bound source record for reproducing this finding?',
      rationale: 'No source record supplied to challenge engine.',
    });
  } else {
    checks.push({
      key: 'record_binding',
      status: 'PASS',
      question: 'Is there a bound source record for reproducing this finding?',
      rationale: `Record: ${record.id}`,
    });

    if (flag.citationKey === 'COMAR_21_05_06_02A' && record.method === 'Emergency') {
      const duration = daysBetween(record.startDate, record.currentEndDate);
      checks.push({
        key: 'duration_math',
        status: duration > 365 ? 'PASS' : 'FAIL',
        question: 'Does emergency duration arithmetic support the signal?',
        rationale: `Duration: ${duration} days`,
      });
    }

    if (flag.citationKey === 'COMAR_21_05_07_05A') {
      checks.push({
        key: 'pattern_not_verdict',
        status: 'WARN',
        question: 'Is this correctly labeled as a heuristic instead of a legal conclusion?',
        rationale: 'Contract splitting requires additional context; keep as risk indicator.',
      });
    }
  }

  const total = checks.reduce((sum, check) => sum + scoreCheck(check.status), 0);
  const score = checks.length === 0 ? 0 : Math.round((total / checks.length) * 100);

  const disposition = score >= 85 ? 'DEFENSIBLE' : score >= 60 ? 'NEEDS_REVIEW' : 'WEAK_SIGNAL';
  return { flagId: flag.id, score, disposition, checks };
}

export function runChallengeEngineForPortfolio(flags: RiskFlag[], records: ProcurementRecord[]): ChallengeResult[] {
  const byId = new Map(records.map((record) => [record.id, record]));
  return flags.map((flag) => runChallengeEngine(flag, flag.recordId ? byId.get(flag.recordId) : undefined));
}
