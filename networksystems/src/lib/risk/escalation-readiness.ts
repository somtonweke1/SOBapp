import type { RiskFlag } from '@/lib/risk/engine';
import type { ClaimValidationResult } from '@/lib/risk/claim-validation';

export type EscalationCheckStatus = 'PASS' | 'WARN' | 'FAIL';

export type EscalationCheck = {
  key: string;
  status: EscalationCheckStatus;
  detail: string;
};

export type EscalationReadiness = {
  flagId: string;
  score: number;
  ready: boolean;
  recommendedAction: 'ESCALATE_NOW' | 'REVIEW_FIRST' | 'HOLD';
  priority: number;
  contacts: string[];
  checks: EscalationCheck[];
};

function scoreStatus(status: EscalationCheckStatus): number {
  if (status === 'PASS') return 1;
  if (status === 'WARN') return 0.5;
  return 0;
}

function buildContacts(flag: RiskFlag): string[] {
  const contacts = [
    `${flag.agency} procurement/contracts officer`,
    `${flag.vendor} compliance or legal lead`,
  ];

  if (flag.jurisdiction === 'Maryland State') {
    contacts.push('Prime bidder estimating lead (Maryland project team)');
    contacts.push('Prime bidder MBE/DBE compliance manager');
  } else {
    contacts.push('City project manager for award/subcontract review');
    contacts.push('Prime bidder contracts lead (Baltimore City project)');
  }

  return contacts;
}

export function evaluateEscalationReadiness(
  flags: RiskFlag[],
  options: {
    scannerIsStale?: boolean;
    claimValidationByFlagId?: Map<string, ClaimValidationResult>;
  } = {}
): EscalationReadiness[] {
  return flags.map((flag) => {
    const checks: EscalationCheck[] = [];
    const challenge = flag.challengeScore ?? 0;

    checks.push({
      key: 'source_url',
      status: /^https?:\/\//.test(flag.sourceUrl) ? 'PASS' : 'FAIL',
      detail: flag.sourceUrl || 'Missing source URL',
    });

    checks.push({
      key: 'citation_binding',
      status: flag.citation && flag.citationKey ? 'PASS' : 'FAIL',
      detail: `${flag.citation || 'Missing citation'} ${flag.citationKey ? `(${flag.citationKey})` : ''}`.trim(),
    });

    checks.push({
      key: 'challenge_score',
      status: challenge >= 85 ? 'PASS' : challenge >= 70 ? 'WARN' : 'FAIL',
      detail: `Defensibility ${challenge}%`,
    });

    checks.push({
      key: 'signal_confidence',
      status: flag.confidence >= 0.75 ? 'PASS' : flag.confidence >= 0.6 ? 'WARN' : 'FAIL',
      detail: `Model confidence ${Math.round(flag.confidence * 100)}%`,
    });

    checks.push({
      key: 'severity_basis',
      status: flag.basis === 'STRICT_LAW' || flag.severity === 'HIGH' ? 'PASS' : 'WARN',
      detail: `${flag.basis} / ${flag.severity}`,
    });

    checks.push({
      key: 'scanner_freshness',
      status: options.scannerIsStale ? 'FAIL' : 'PASS',
      detail: options.scannerIsStale ? 'Scanner is stale (>30h)' : 'Scanner is fresh',
    });

    const validation = options.claimValidationByFlagId?.get(flag.id);
    checks.push({
      key: 'claim_correspondence',
      status: validation
        ? (validation.isCorresponding ? 'PASS' : 'FAIL')
        : 'WARN',
      detail: validation
        ? (validation.isCorresponding ? 'Supporting records correspond to the claim.' : validation.issues.join(' | '))
        : 'No correspondence validation result available.',
    });

    const total = checks.reduce((sum, c) => sum + scoreStatus(c.status), 0);
    const score = Math.round((total / checks.length) * 100);
    const hardFail = checks.some((c) => c.status === 'FAIL');
    const ready = !hardFail && score >= 80;
    const recommendedAction = ready ? 'ESCALATE_NOW' : score >= 60 ? 'REVIEW_FIRST' : 'HOLD';
    const priority = Math.round(flag.exposure * flag.confidence * Math.max(0.2, challenge / 100));

    return {
      flagId: flag.id,
      score,
      ready,
      recommendedAction,
      priority,
      contacts: buildContacts(flag),
      checks,
    };
  });
}
