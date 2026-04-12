import type { ProcurementRecord } from '@/lib/api/procurement-ingest';
import type { RiskFlag } from '@/lib/risk/engine';

export type TargetAccount = {
  id: string;
  company: string;
  agencies: string[];
  jurisdictions: string[];
  totalExposure: number;
  riskFindings: number;
  strictFindings: number;
  avgDefensibility: number;
  latestBoardActionDate: string | null;
  sourceUrls: string[];
  sourceLabels: string[];
  activityTypes: string[];
  recommendedPrimaryContact: 'Developer Principal' | 'President' | 'Government Contracts Lead' | 'Operations Lead';
  recommendedSecondaryContact: 'Acquisitions Lead' | 'Asset Manager' | 'Estimator' | 'Operations Lead';
  whyNow: string;
  rapidRiskBrief: {
    name: 'Stonebridge Deal + Vendor Risk Diagnostic';
    priceUsd: 199;
    deliveryHours: 24;
    objective: string;
    output: string;
  };
  procurementFixSprint: {
    name: 'Stonebridge 2-Week Deal Clarity Sprint';
    durationDays: 14;
    feeUsdRange: string;
    focus: string;
    output: string;
  };
  contactDiscovery: {
    queries: string[];
    candidatePeople: Array<{ name: string; titleGuess: string; source: string }>;
  };
};

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function toDate(iso?: string): Date | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysSince(date: Date | null, now: Date): number | null {
  if (!date) return null;
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function inferFocus(flags: RiskFlag[]): string {
  const indicators = flags.map((flag) => `${flag.indicator} ${flag.citation}`.toLowerCase()).join(' ');
  if (indicators.includes('emergency') || indicators.includes('365')) {
    return 'Stress-test emergency dependency and operating continuity before capital is committed';
  }
  if (indicators.includes('sole-source') || indicators.includes('one source')) {
    return 'Test concentration and counterparty dependence around the deal before closing';
  }
  if (indicators.includes('splitting') || indicators.includes('small procurements')) {
    return 'Map procurement-pattern anomalies as one sign layer in the broader deal-risk diagnosis';
  }
  if (indicators.includes('masking')) {
    return 'Normalize hidden entities and ownership links that can distort sponsor underwriting';
  }
  return 'Fuse public operating, property, utility, and procurement signals into a pre-acquisition diagnosis';
}

function feeBand(totalExposure: number, strictFindings: number): string {
  if (totalExposure >= 5_000_000 || strictFindings >= 2) return '$100,000';
  if (totalExposure >= 1_500_000 || strictFindings >= 1) return '$75,000';
  return '$50,000';
}

function recommendContacts(
  records: ProcurementRecord[],
  jurisdictions: string[],
  strictFindings: number
): Pick<TargetAccount, 'recommendedPrimaryContact' | 'recommendedSecondaryContact'> {
  const activityTypes = new Set(records.map((record) => record.activityType).filter(Boolean));
  const sourceLabels = new Set(records.map((record) => record.sourceLabel).filter(Boolean));

  if (activityTypes.has('low_bidder') || sourceLabels.has('Maryland Bid Network')) {
    return {
      recommendedPrimaryContact: 'President',
      recommendedSecondaryContact: 'Estimator',
    };
  }

  if (activityTypes.has('award') || jurisdictions.includes('Maryland State')) {
    return {
      recommendedPrimaryContact: 'Government Contracts Lead',
      recommendedSecondaryContact: strictFindings > 0 ? 'Operations Lead' : 'Estimator',
    };
  }

  return {
    recommendedPrimaryContact: 'Developer Principal',
    recommendedSecondaryContact: strictFindings > 0 ? 'Asset Manager' : 'Acquisitions Lead',
  };
}

function buildContactQueries(
  company: string,
  primaryContact: TargetAccount['recommendedPrimaryContact'],
  secondaryContact: TargetAccount['recommendedSecondaryContact']
): string[] {
  return [
    `"${company}" "${primaryContact.toLowerCase()}"`,
    `"${company}" "${secondaryContact.toLowerCase()}"`,
    `"${company}" Maryland contracts`,
  ];
}

export function buildTargetAccountFeed(
  records: ProcurementRecord[],
  flags: RiskFlag[],
  now = new Date()
): TargetAccount[] {
  const byVendor = new Map<string, { records: ProcurementRecord[]; flags: RiskFlag[] }>();

  for (const record of records) {
    const key = (record.canonicalVendorName || record.vendor || '').trim();
    if (!key) continue;
    const current = byVendor.get(key) || { records: [], flags: [] };
    current.records.push(record);
    byVendor.set(key, current);
  }

  for (const flag of flags) {
    const key = (flag.vendor || '').trim();
    if (!key) continue;
    const current = byVendor.get(key) || { records: [], flags: [] };
    current.flags.push(flag);
    byVendor.set(key, current);
  }

  const targets: TargetAccount[] = [];

  for (const [company, bucket] of byVendor.entries()) {
    if (bucket.flags.length === 0) continue;

    const latestRecordDate = bucket.records
      .map((record) => toDate(record.boardActionDate))
      .filter((date): date is Date => !!date)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    const strictFindings = bucket.flags.filter((flag) => flag.basis === 'STRICT_LAW').length;
    const totalExposure = bucket.flags.reduce((sum, flag) => sum + (flag.exposure || 0), 0);
    const avgDefensibility = Math.round(
      bucket.flags.reduce((sum, flag) => sum + (flag.challengeScore || 0), 0) / Math.max(1, bucket.flags.length)
    );
    const recencyDays = daysSince(latestRecordDate, now);
    const recencyText = recencyDays === null ? 'recent cycle' : recencyDays <= 30 ? `${recencyDays}d` : `${recencyDays}d`;
    const strictText = strictFindings > 0 ? `${strictFindings} strict-law` : 'heuristic-only';
    const focus = inferFocus(bucket.flags);
    const feeRange = feeBand(totalExposure, strictFindings);
    const sourceLabels = Array.from(new Set(bucket.records.map((record) => record.sourceLabel).filter(Boolean))) as string[];
    const activityTypes = Array.from(new Set(bucket.records.map((record) => record.activityType).filter(Boolean))) as string[];
    const contacts = recommendContacts(bucket.records, Array.from(new Set(bucket.flags.map((flag) => flag.jurisdiction))), strictFindings);
    const sourceText = sourceLabels.length > 0 ? ` via ${sourceLabels.slice(0, 2).join(' + ')}` : '';

    targets.push({
      id: slugify(company),
      company,
      agencies: Array.from(new Set(bucket.flags.map((flag) => flag.agency))),
      jurisdictions: Array.from(new Set(bucket.flags.map((flag) => flag.jurisdiction))),
      totalExposure,
      riskFindings: bucket.flags.length,
      strictFindings,
      avgDefensibility,
      latestBoardActionDate: latestRecordDate ? latestRecordDate.toISOString() : null,
      sourceUrls: Array.from(new Set(bucket.flags.map((flag) => flag.sourceUrl).filter(Boolean))).slice(0, 4),
      sourceLabels,
      activityTypes,
      recommendedPrimaryContact: contacts.recommendedPrimaryContact,
      recommendedSecondaryContact: contacts.recommendedSecondaryContact,
      whyNow: `${bucket.flags.length} public risk signals (${strictText}), ${recencyText} since latest traceable activity${sourceText}.`,
      rapidRiskBrief: {
        name: 'Stonebridge Deal + Vendor Risk Diagnostic',
        priceUsd: 199,
        deliveryHours: 24,
        objective: 'Diagnose hidden deal or vendor risk before acquisition, onboarding, financing, or contract signature.',
        output: `Proceed/Caution/Escalate memo with source-linked evidence for ${company}.`,
      },
      procurementFixSprint: {
        name: 'Stonebridge 2-Week Deal Clarity Sprint',
        durationDays: 14,
        feeUsdRange: feeRange,
        focus,
        output: 'Deeper diligence package with diagnosis, remediation paths, and executive decision memo.',
      },
      contactDiscovery: {
        queries: buildContactQueries(company, contacts.recommendedPrimaryContact, contacts.recommendedSecondaryContact),
        candidatePeople: [],
      },
    });
  }

  return targets.sort((a, b) => {
    const scoreA = a.totalExposure * Math.max(0.2, a.avgDefensibility / 100);
    const scoreB = b.totalExposure * Math.max(0.2, b.avgDefensibility / 100);
    return scoreB - scoreA;
  });
}
