import type { DealDecision, DealPropertyType, DealRecord, DealSubmittedBy, Prisma } from '@prisma/client';
import type { ForensicReport } from '@/lib/api/forensic-scan';

const STREET_TYPE_MAP: Record<string, string> = {
  STREET: 'ST',
  ST: 'ST',
  AVENUE: 'AVE',
  AVE: 'AVE',
  ROAD: 'RD',
  RD: 'RD',
  BOULEVARD: 'BLVD',
  BLVD: 'BLVD',
  DRIVE: 'DR',
  DR: 'DR',
  LANE: 'LN',
  LN: 'LN',
  COURT: 'CT',
  CT: 'CT',
  PLACE: 'PL',
  PL: 'PL',
  PARKWAY: 'PKWY',
  PKWY: 'PKWY',
  TERRACE: 'TER',
  TER: 'TER',
  CIRCLE: 'CIR',
  CIR: 'CIR',
  WAY: 'WAY',
};

export type DealRecordContext = {
  submittedBy?: DealSubmittedBy;
  institutionName?: string | null;
  notes?: string | null;
};

export function normalizeDealAddress(address: string): string {
  return address
    .toUpperCase()
    .replace(/[.,]/g, ' ')
    .replace(/\bMARYLAND\b/g, 'MD')
    .replace(/\bBALTIMORE CITY\b/g, 'BALTIMORE')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((token) => STREET_TYPE_MAP[token] || token)
    .join(' ');
}

export function extractZipCode(address: string): string | null {
  const match = address.match(/\b(\d{5})\b/);
  return match?.[1] ?? null;
}

export function neighborhoodFromZip(zipCode: string | null): string | null {
  if (!zipCode) return null;
  return null;
}

export function classifyPropertyType(landUse: string | undefined): DealPropertyType | null {
  if (!landUse) return null;

  const normalized = landUse.toUpperCase();

  if (normalized.includes('EXEMPT')) return 'EXEMPT';
  if (normalized.includes('MIXED')) return 'MIXED';
  if (normalized.includes('COMMERCIAL')) return 'COMMERCIAL';
  if (normalized.includes('RESIDENTIAL')) return 'RESIDENTIAL';

  return null;
}

export function decisionToRecordValue(outcome: ForensicReport['decision']['outcome']): DealDecision {
  switch (outcome) {
    case 'proceed':
      return 'PROCEED';
    case 'caution':
      return 'CAUTION';
    case 'escalate':
      return 'ESCALATE';
    default:
      return 'INSUFFICIENT';
  }
}

export function buildDealRecordData(
  report: ForensicReport,
  context: DealRecordContext = {}
): Prisma.DealRecordUncheckedCreateInput {
  const subject = report.subject;
  const address = normalizeDealAddress(subject?.address || report.queryAddress);
  const zipCode = extractZipCode(subject?.address || report.queryAddress);
  const permitTypes = report.datasets.permits.records
    .map((record) => record.description?.trim())
    .filter((value): value is string => Boolean(value));
  const violationTypes = report.datasets.codeViolations.records
    .map((record) => record.violationText?.trim())
    .filter((value): value is string => Boolean(value));

  return {
    address,
    zip_code: zipCode,
    neighborhood: neighborhoodFromZip(zipCode),
    property_type: classifyPropertyType(subject?.landUse),
    zoning_code: subject?.zoning || null,
    land_use: subject?.landUse || null,
    assessment_value: typeof subject?.assessmentValue === 'number' ? Math.round(subject.assessmentValue) : null,
    owner_name: subject?.owner || null,
    permit_count: report.datasets.permits.records.length,
    permit_types: Array.from(new Set(permitTypes)),
    active_violations: report.datasets.codeViolations.records.filter((record) => {
      const status = record.citationStatus?.trim().toUpperCase() || '';
      return status !== 'CLOSED' && status !== 'ABATED' && status !== 'COMPLIED';
    }).length,
    violation_types: Array.from(new Set(violationTypes)),
    vacant_notice: report.datasets.vacantBuildingNotices.records.length > 0,
    decision: decisionToRecordValue(report.decision.outcome),
    decision_drivers: report.decision.drivers,
    submitted_by: context.submittedBy || 'ANONYMOUS',
    institution_name: context.institutionName || null,
    scan_timestamp: new Date(report.runAt),
    notes: context.notes || null,
  };
}

export function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (!/[",\n]/.test(stringValue)) return stringValue;
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function dealRecordToCsvRow(record: DealRecord): string {
  return [
    record.id,
    record.address,
    record.zip_code,
    record.neighborhood,
    record.property_type,
    record.zoning_code,
    record.land_use,
    record.assessment_value,
    record.owner_name,
    record.permit_count,
    record.permit_types.join(' | '),
    record.active_violations,
    record.violation_types.join(' | '),
    record.vacant_notice,
    record.decision,
    record.decision_drivers.join(' | '),
    record.submitted_by,
    record.institution_name,
    record.scan_timestamp.toISOString(),
    record.outcome_reported,
    record.outcome,
    record.outcome_reported_at?.toISOString() || '',
    record.notes,
  ]
    .map(csvEscape)
    .join(',');
}
