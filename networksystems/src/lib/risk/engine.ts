import type { ProcurementRecord } from '@/lib/api/procurement-ingest';
import { runChallengeEngineForPortfolio } from '@/lib/risk/challenge-engine';
import { resolveProcurementVendors } from '@/lib/risk/vendor-resolution';

export type CitationKey =
  | 'COMAR_21_05_06_02A'
  | 'COMAR_21_05_05'
  | 'COMAR_21_05_07_05A'
  | 'BALT_CHARTER_ART_VI_11';

export type RiskFlag = {
  id: string;
  recordId?: string;
  supportingRecordIds?: string[];
  jurisdiction: 'Maryland State' | 'Baltimore City';
  agency: string;
  vendor: string;
  vendorEntityId?: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  indicator: string;
  basis: 'STRICT_LAW' | 'RISK_HEURISTIC';
  citationKey: CitationKey;
  citation: string;
  confidence: number;
  exposure: number;
  sourceUrl: string;
  logicTrace: string;
  zipCode?: string;
  dataLane?: 'BALTIMORE_UTILITY_LEAKAGE' | 'BALTIMORE_PROPERTY' | 'PROCUREMENT_GENERAL';
  challengeScore?: number;
  challengeDisposition?: 'DEFENSIBLE' | 'NEEDS_REVIEW' | 'WEAK_SIGNAL';
};

export const statuteLibrary: Record<CitationKey, { title: string; url: string; text: string }> = {
  COMAR_21_05_06_02A: {
    title: 'COMAR 21.05.06.02(A)',
    url: 'https://regs.maryland.gov/COMAR/TitleSearch.aspx?search=21.05.06',
    text: 'Emergency procurement terms are restricted and should not be used as a substitute for standard competitive procurement planning.',
  },
  COMAR_21_05_05: {
    title: 'COMAR 21.05.05',
    url: 'https://regs.maryland.gov/COMAR/TitleSearch.aspx?search=21.05.05',
    text: 'Sole source procurement is limited to circumstances where only one source is determined reasonably available.',
  },
  COMAR_21_05_07_05A: {
    title: 'COMAR 21.05.07.05(A)',
    url: 'https://regs.maryland.gov/COMAR/TitleSearch.aspx?search=21.05.07',
    text: 'Procurements may not be artificially divided to circumvent procurement requirements.',
  },
  BALT_CHARTER_ART_VI_11: {
    title: 'Baltimore City Charter Art. VI, §11',
    url: 'https://codes.baltimorecity.gov/us/md/cities/baltimore/charter/VI/11',
    text: 'City contracts generally require competitive procedures, with emergency pathways intended for urgent exceptions.',
  },
};

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function isGeneralSupply(category?: string): boolean {
  const text = (category || '').toLowerCase();
  return text.includes('general') || text.includes('supply') || text.includes('office');
}

const LIVE_SMALL_PROCUREMENT_THRESHOLD = 25_000;
const LIVE_CONCENTRATION_MIN_CONTRACTS = 4;
const LIVE_HIGH_VALUE_BALT_THRESHOLD = 250_000;

function extractZipCode(input?: string): string | undefined {
  if (!input) return undefined;
  const match = input.match(/\b(21\d{3})\b/);
  return match?.[1];
}

function buildBaseFlag(record: ProcurementRecord): Pick<
  RiskFlag,
  | 'recordId'
  | 'supportingRecordIds'
  | 'jurisdiction'
  | 'agency'
  | 'vendor'
  | 'vendorEntityId'
  | 'exposure'
  | 'sourceUrl'
  | 'zipCode'
  | 'dataLane'
> {
  return {
    recordId: record.id,
    supportingRecordIds: [record.id],
    jurisdiction: record.jurisdiction,
    agency: record.agency,
    vendor: record.canonicalVendorName || record.vendor,
    vendorEntityId: record.vendorEntityId,
    exposure: record.amount,
    sourceUrl: record.sourceUrl,
    zipCode: extractZipCode(record.vendorAddress),
    dataLane: record.jurisdiction === 'Baltimore City' ? 'BALTIMORE_PROPERTY' : 'PROCUREMENT_GENERAL',
  };
}

export function analyzeProcurementRisk(record: ProcurementRecord): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const durationDays = daysBetween(record.startDate, record.currentEndDate);
  const base = buildBaseFlag(record);

  if (
    record.jurisdiction === 'Maryland State' &&
    record.method === 'Emergency' &&
    durationDays > 365 &&
    !record.waiverGranted
  ) {
    flags.push({
      id: `${record.id}-emergency-duration`,
      ...base,
      severity: 'HIGH',
      indicator: 'Emergency term duration exceeds 365 days',
      basis: 'STRICT_LAW',
      citationKey: 'COMAR_21_05_06_02A',
      citation: 'COMAR 21.05.06.02(A)',
      confidence: 0.95,
      logicTrace:
        'RULE: maryland_emergency_duration_gt_365_no_waiver; IF method=Emergency AND durationDays>365 AND waiverGranted=false THEN HIGH strict-law flag.',
    });
  }

  if (record.jurisdiction === 'Maryland State' && record.method === 'Sole Source' && isGeneralSupply(record.category)) {
    flags.push({
      id: `${record.id}-sole-source-general`,
      ...base,
      severity: 'MEDIUM',
      indicator: 'Sole-source used for category likely to have multiple suppliers',
      basis: 'RISK_HEURISTIC',
      citationKey: 'COMAR_21_05_05',
      citation: 'COMAR 21.05.05',
      confidence: 0.7,
      logicTrace:
        'RULE: maryland_sole_source_general_supply; IF method=Sole Source AND category in {general,supply,office} THEN MEDIUM heuristic flag.',
    });
  }

  if (record.jurisdiction === 'Baltimore City' && record.method === 'Emergency' && record.amount > 1_000_000) {
    flags.push({
      id: `${record.id}-city-high-emergency`,
      ...base,
      severity: 'MEDIUM',
      indicator: 'High-value city emergency procurement should receive heightened review',
      basis: 'RISK_HEURISTIC',
      citationKey: 'BALT_CHARTER_ART_VI_11',
      citation: 'Baltimore City Charter Art. VI, §11',
      confidence: 0.65,
      logicTrace:
        'RULE: baltimore_emergency_high_value; IF jurisdiction=Baltimore City AND method=Emergency AND amount>1000000 THEN MEDIUM heuristic flag.',
    });
  }

  return flags;
}

export function analyzePortfolioRisk(records: ProcurementRecord[]): RiskFlag[] {
  const resolved = resolveProcurementVendors(records);
  const resolvedRecords = resolved.records;

  const flags: RiskFlag[] = resolvedRecords.flatMap((record) => analyzeProcurementRisk(record));

  // Live-structure flags aligned to the procurement scanner signal profile.
  const longDuration = resolvedRecords
    .filter((record) => daysBetween(record.startDate, record.currentEndDate) > 365 * 3)
    .slice(0, 120);
  for (const record of longDuration) {
    flags.push({
      id: `${record.id}-long-duration`,
      ...buildBaseFlag(record),
      severity: 'MEDIUM',
      indicator: 'Contract term exceeds 3 years',
      basis: 'RISK_HEURISTIC',
      citationKey: 'COMAR_21_05_06_02A',
      citation: 'COMAR 21.05.06.02(A)',
      confidence: 0.72,
      logicTrace:
        'RULE: live_duration_gt_1095_days; IF durationDays > 1095 THEN MEDIUM heuristic flag.',
    });
  }

  const byVendorAgency = new Map<string, ProcurementRecord[]>();
  for (const record of resolvedRecords) {
    const key = `${record.jurisdiction}__${record.agency}__${record.vendorEntityId || record.vendor}`;
    byVendorAgency.set(key, [...(byVendorAgency.get(key) || []), record]);
  }
  for (const rows of byVendorAgency.values()) {
    if (rows.length < LIVE_CONCENTRATION_MIN_CONTRACTS) continue;
    const exposure = rows.reduce((sum, row) => sum + row.amount, 0);
    const sample = rows[0];
    flags.push({
      id: `${sample.id}-vendor-concentration`,
      jurisdiction: sample.jurisdiction,
      agency: sample.agency,
      vendor: sample.canonicalVendorName || sample.vendor,
      supportingRecordIds: rows.map((row) => row.id),
      vendorEntityId: sample.vendorEntityId,
      severity: rows.length >= 8 ? 'HIGH' : 'MEDIUM',
      indicator: `Vendor concentration (${rows.length} active contracts)`,
      basis: 'RISK_HEURISTIC',
      citationKey: 'COMAR_21_05_05',
      citation: 'COMAR 21.05.05',
      confidence: 0.7,
      exposure,
      sourceUrl: sample.sourceUrl,
      logicTrace:
        'RULE: live_vendor_concentration; IF same vendor appears >=4 times in agency scope THEN concentration risk flag.',
    });
  }

  // State-only contract splitting indicator: repeated small procurements to same vendor entity/agency.
  const small = resolvedRecords.filter(
    (record) => record.jurisdiction === 'Maryland State' && record.method === 'Small Procurement'
  );
  const grouped = new Map<string, ProcurementRecord[]>();
  for (const row of small) {
    const key = `${row.agency}__${row.vendorEntityId || row.vendor}`;
    grouped.set(key, [...(grouped.get(key) || []), row]);
  }

  for (const [key, rows] of grouped) {
    if (rows.length <= 5) continue;
    const exposure = rows.reduce((sum, row) => sum + row.amount, 0);
    const [agency] = key.split('__');
    const vendor = rows[0]?.canonicalVendorName || rows[0]?.vendor || 'Unknown Vendor';
    flags.push({
      id: `split-${agency}-${vendor}`.replace(/\s+/g, '-').toLowerCase(),
      jurisdiction: 'Maryland State',
      agency,
      vendor,
      supportingRecordIds: rows.map((row) => row.id),
      vendorEntityId: rows[0]?.vendorEntityId,
      severity: 'HIGH',
      indicator: 'Potential contract splitting pattern across small procurements',
      basis: 'RISK_HEURISTIC',
      citationKey: 'COMAR_21_05_07_05A',
      citation: 'COMAR 21.05.07.05(A)',
      confidence: 0.8,
      exposure,
      sourceUrl: rows[0]?.sourceUrl || 'https://procurement.maryland.gov/',
      logicTrace:
        'RULE: maryland_small_procurement_cluster; IF >5 small procurements for same agency + resolved vendor entity THEN HIGH heuristic contract-splitting flag.',
    });
  }

  const baltSmall = resolvedRecords.filter(
    (record) =>
      record.jurisdiction === 'Baltimore City' &&
      record.amount > 0 &&
      record.amount < LIVE_SMALL_PROCUREMENT_THRESHOLD
  );
  const baltGrouped = new Map<string, ProcurementRecord[]>();
  for (const row of baltSmall) {
    const key = `${row.agency}__${row.vendorEntityId || row.vendor}`;
    baltGrouped.set(key, [...(baltGrouped.get(key) || []), row]);
  }
  for (const rows of baltGrouped.values()) {
    if (rows.length < 2) continue;
    const sorted = [...rows].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    for (let i = 0; i < sorted.length; i += 1) {
      const anchor = sorted[i];
      const anchorTime = new Date(anchor.startDate).getTime();
      if (Number.isNaN(anchorTime)) continue;
      const windowRows = sorted.filter((row) => {
        const rowTime = new Date(row.startDate).getTime();
        return !Number.isNaN(rowTime) && Math.abs(rowTime - anchorTime) <= 90 * 86_400_000;
      });
      if (windowRows.length < 2) continue;
      const exposure = windowRows.reduce((sum, row) => sum + row.amount, 0);
      if (exposure <= LIVE_SMALL_PROCUREMENT_THRESHOLD) continue;
      flags.push({
        id: `${anchor.id}-balt-split-window`,
        jurisdiction: 'Baltimore City',
        agency: anchor.agency,
        vendor: anchor.canonicalVendorName || anchor.vendor,
        supportingRecordIds: windowRows.map((row) => row.id),
        vendorEntityId: anchor.vendorEntityId,
        severity: 'HIGH',
        indicator: `Potential split-contract pattern (${windowRows.length} contracts in 90 days)`,
        basis: 'STRICT_LAW',
        citationKey: 'COMAR_21_05_07_05A',
        citation: 'COMAR 21.05.07.05(A)',
        confidence: 0.85,
        exposure,
        sourceUrl: anchor.sourceUrl,
        logicTrace:
          'RULE: baltimore_small_window_split; IF multiple sub-threshold contracts in 90 days exceed threshold combined THEN HIGH strict-law flag.',
      });
      break;
    }
  }

  const highValueBaltimore = resolvedRecords
    .filter((record) => record.jurisdiction === 'Baltimore City' && record.amount >= LIVE_HIGH_VALUE_BALT_THRESHOLD)
    .slice(0, 120);
  for (const record of highValueBaltimore) {
    flags.push({
      id: `${record.id}-balt-high-value`,
      ...buildBaseFlag(record),
      severity: record.amount >= 1_000_000 ? 'HIGH' : 'MEDIUM',
      indicator: 'High-value blanket contract requires elevated review',
      basis: 'RISK_HEURISTIC',
      citationKey: 'BALT_CHARTER_ART_VI_11',
      citation: 'Baltimore City Charter Art. VI, §11',
      confidence: 0.78,
      logicTrace:
        'RULE: baltimore_high_value_contract; IF Baltimore contract amount >= 250000 THEN elevated review flag.',
    });
  }

  // Baltimore utility leakage lane: turns utility/payment leakage into explicit loop-ready financial signals.
  const baltimoreUtilityRows = resolvedRecords.filter((record) => {
    if (record.jurisdiction !== 'Baltimore City') return false;
    const text = `${record.vendor} ${record.category || ''}`.toLowerCase();
    return /(utility|water|sewer|waste|power|electric|energy)/.test(text);
  });
  for (const record of baltimoreUtilityRows.slice(0, 200)) {
    const zipCode = extractZipCode(record.vendorAddress);
    flags.push({
      id: `${record.id}-balt-utility-leakage`,
      ...buildBaseFlag(record),
      severity: record.amount >= 150_000 ? 'HIGH' : 'MEDIUM',
      indicator: `Utility leakage exposure${zipCode ? ` in ZIP ${zipCode}` : ''}`,
      basis: 'RISK_HEURISTIC',
      citationKey: 'BALT_CHARTER_ART_VI_11',
      citation: 'Baltimore City Charter Art. VI, §11',
      confidence: 0.76,
      logicTrace:
        'RULE: baltimore_utility_leakage_lane; IF Baltimore utility/water/sewer spend pattern exists THEN utility leakage signal.',
      zipCode,
      dataLane: 'BALTIMORE_UTILITY_LEAKAGE',
    });
  }

  // Vendor masking indicator: different vendor labels sharing contact metadata.
  const byContact = new Map<string, ProcurementRecord[]>();
  for (const row of resolvedRecords) {
    if (!row.vendorAddress && !row.vendorPhone) continue;
    const key = `${(row.vendorAddress || '').toLowerCase()}__${(row.vendorPhone || '').toLowerCase()}`;
    byContact.set(key, [...(byContact.get(key) || []), row]);
  }

  for (const rows of byContact.values()) {
    const distinctRawVendors = new Set(rows.map((r) => r.vendor));
    const distinctEntities = new Set(rows.map((r) => r.vendorEntityId || r.vendor));
    if (distinctRawVendors.size < 2 || distinctEntities.size < 2) continue;
    const exposure = rows.reduce((sum, row) => sum + row.amount, 0);
    const agency = rows[0]?.agency || 'Unknown Agency';
    const vendor = [...distinctRawVendors].slice(0, 3).join(', ');
    flags.push({
      id: `masking-${agency}-${vendor}`.replace(/\s+/g, '-').toLowerCase(),
      jurisdiction: rows[0]?.jurisdiction || 'Maryland State',
      agency,
      vendor,
      supportingRecordIds: rows.map((row) => row.id),
      vendorEntityId: rows[0]?.vendorEntityId,
      severity: 'HIGH',
      indicator: 'Potential vendor masking via shared address/phone metadata',
      basis: 'RISK_HEURISTIC',
      citationKey: 'COMAR_21_05_07_05A',
      citation: 'COMAR 21.05.07.05(A)',
      confidence: 0.74,
      exposure,
      sourceUrl: rows[0]?.sourceUrl || 'https://procurement.maryland.gov/',
      logicTrace:
        'RULE: vendor_masking_shared_contact; IF multiple vendor labels share address/phone metadata but resolve to distinct entities THEN HIGH heuristic masking flag.',
    });
  }

  const challengeResults = runChallengeEngineForPortfolio(flags, resolvedRecords);
  const byId = new Map(challengeResults.map((result) => [result.flagId, result]));

  return flags
    .map((flag) => {
      const challenge = byId.get(flag.id);
      if (!challenge) return flag;
      return {
        ...flag,
        challengeScore: challenge.score,
        challengeDisposition: challenge.disposition,
      };
    })
    .sort((a, b) => b.exposure - a.exposure)
    .slice(0, 350);
}
