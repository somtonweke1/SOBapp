import type { ProcurementMethod, ProcurementRecord } from '@/lib/api/procurement-ingest';

const SOCRATA_TOKEN = process.env.SOCRATA_TOKEN ?? process.env.SOCRATA_APP_TOKEN ?? '';

const MONTGOMERY_CONTRACTS_URL = 'https://data.montgomerycountymd.gov/resource/ku39-t2wt.json';
const BALTIMORE_CONTRACTS_QUERY_URL =
  'https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/Baltimore_CityContracts_Bureau_of_Purchases_Department_of_Finance/FeatureServer/0/query';
const DGS_BIDS_AWARDS_URL = 'https://dgs.maryland.gov/Pages/Procurement/BidsAwards.aspx';
const MARYLAND_BIDS_URL = 'https://www.marylandbids.com/';
const BIDS_USA_MARYLAND_SAM_URL = 'https://www.bidsusa.net/RFP/SAM.GOV-Contract-Opportunities-Maryland.htm';

const SMALL_PROCUREMENT_THRESHOLD = 25_000;
const CONCENTRATION_MIN_CONTRACTS = 4;
const HIGH_VALUE_BALT_THRESHOLD = 250_000;

export type LiveRiskFlag = {
  agency: string;
  vendor: string;
  amount: number;
  rule: string;
  citation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
  sourceUrl: string;
  contractDate: string;
};

export type LiveScanResult = {
  asOf: string;
  source: 'live' | 'unavailable';
  provider?: string;
  flags: LiveRiskFlag[];
  vendorsImpacted: number;
  totalExposure: number;
  strictLawShare: number;
  sourceSummaries: LiveSourceSummary[];
};

export type LiveSourceSummary = {
  id: string;
  label: string;
  url: string;
  category: 'official' | 'market';
  activityType: 'contracts' | 'awards' | 'low_bidder' | 'solicitations';
  status: 'live' | 'partial' | 'unavailable';
  recordsDetected: number;
  lastUpdatedAt?: string;
  note: string;
};

type MontgomeryContract = {
  contractno?: string;
  contracttype?: string;
  contractdesc?: string;
  vendor?: string;
  vendoraddress?: string;
  vendorphone?: string;
  deptname?: string;
  execution?: string;
  expiration?: string;
  extend?: string;
};

type ArcGisResponse = {
  features?: Array<{
    attributes?: {
      PO_Number?: string;
      Short_Description?: string;
      Vendor_Name?: string;
      Blanket_Begin_Date?: number;
      Blanket_End_Date?: number;
      Department_Allowed_to_Purchase?: string;
      Blanket_Dollar_Limit?: number;
      Dollar_Amt_Spent_to_Date?: number;
      Dollars_Left?: number;
    };
  }>;
};

type NormalizedContract = {
  jurisdiction: 'montgomery-md' | 'baltimore-city';
  agency: string;
  vendor: string;
  description: string;
  method: string;
  amount: number;
  amountSpent: number;
  amountLeft: number;
  startDate: string;
  endDate: string;
  sourceUrl: string;
  contractId: string;
  vendorAddress?: string;
  vendorPhone?: string;
  activityType?: 'contract' | 'award' | 'low_bidder' | 'solicitation';
  sourceLabel?: string;
  sourceSystem?: string;
};

type SourceFetchResult = {
  contracts: NormalizedContract[];
  summary: LiveSourceSummary;
};

function severityScore(value: LiveRiskFlag['severity']): number {
  switch (value) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    default:
      return 1;
  }
}

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${url} ${body.slice(0, 180).replace(/\s+/g, ' ')}`);
  }
  return res.json();
}

async function fetchHtml(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, { ...init, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${url} ${body.slice(0, 180).replace(/\s+/g, ' ')}`);
  }
  return res.text();
}

async function fetchMontgomeryContracts(): Promise<MontgomeryContract[]> {
  const params = new URLSearchParams({
    $limit: '500',
    $order: 'execution DESC',
  });

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (SOCRATA_TOKEN) headers['X-App-Token'] = SOCRATA_TOKEN;

  const json = await fetchJson(`${MONTGOMERY_CONTRACTS_URL}?${params.toString()}`, { headers });
  return Array.isArray(json) ? (json as MontgomeryContract[]) : [];
}

async function fetchBaltimoreContracts(): Promise<ArcGisResponse['features']> {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: [
      'PO_Number',
      'Short_Description',
      'Vendor_Name',
      'Blanket_Begin_Date',
      'Blanket_End_Date',
      'Department_Allowed_to_Purchase',
      'Blanket_Dollar_Limit',
      'Dollar_Amt_Spent_to_Date',
      'Dollars_Left',
    ].join(','),
    orderByFields: 'OBJECTID DESC',
    resultRecordCount: '1000',
    f: 'json',
  });

  const json = (await fetchJson(`${BALTIMORE_CONTRACTS_QUERY_URL}?${params.toString()}`)) as ArcGisResponse;
  return Array.isArray(json.features) ? json.features : [];
}

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toIso(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function toIsoDate(value: unknown): string {
  const iso = toIso(value);
  return iso ? iso.slice(0, 10) : '1970-01-01';
}

function daysBetweenIso(aIso: string, bIso: string): number {
  const a = new Date(aIso);
  const b = new Date(bIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.abs(b.getTime() - a.getTime()) / 86_400_000;
}

function normalizeMontgomery(rows: MontgomeryContract[]): NormalizedContract[] {
  return rows.map((row) => ({
    jurisdiction: 'montgomery-md',
    agency: row.deptname || 'Montgomery County',
    vendor: row.vendor || 'Unknown Vendor',
    description: row.contractdesc || '',
    method: row.contracttype || '',
    amount: 0,
    amountSpent: 0,
    amountLeft: 0,
    startDate: toIso(row.execution),
    endDate: toIso(row.expiration || row.extend),
    sourceUrl: 'https://data.montgomerycountymd.gov/Government/Award-Solicitations/ku39-t2wt',
    contractId: row.contractno || '',
    vendorAddress: row.vendoraddress,
    vendorPhone: row.vendorphone,
  }));
}

function normalizeBaltimore(features: ArcGisResponse['features']): NormalizedContract[] {
  return (features || []).map((feature) => {
    const a = feature.attributes || {};
    return {
      jurisdiction: 'baltimore-city',
      agency: a.Department_Allowed_to_Purchase || 'Baltimore City',
      vendor: a.Vendor_Name || 'Unknown Vendor',
      description: a.Short_Description || '',
      method: 'City Blanket Contract',
      amount: toNum(a.Blanket_Dollar_Limit),
      amountSpent: toNum(a.Dollar_Amt_Spent_to_Date),
      amountLeft: toNum(a.Dollars_Left),
      startDate: toIso(a.Blanket_Begin_Date),
      endDate: toIso(a.Blanket_End_Date),
      sourceUrl:
        'https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/Baltimore_CityContracts_Bureau_of_Purchases_Department_of_Finance/FeatureServer/0',
      contractId: a.PO_Number || '',
      activityType: 'contract',
      sourceLabel: 'Baltimore City Bureau of Purchases',
      sourceSystem: 'baltimore_city_arcgis',
    };
  });
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r/g, '\n');
}

function toTextLines(html: string): string[] {
  return stripHtml(html)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function parseUsDate(value: string | undefined): string {
  if (!value) return '1970-01-01';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '1970-01-01';
  return date.toISOString().slice(0, 10);
}

function parseCurrencyFromText(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function buildSourceSummary(
  id: string,
  label: string,
  url: string,
  category: LiveSourceSummary['category'],
  activityType: LiveSourceSummary['activityType'],
  status: LiveSourceSummary['status'],
  recordsDetected: number,
  note: string,
  lastUpdatedAt?: string
): LiveSourceSummary {
  return {
    id,
    label,
    url,
    category,
    activityType,
    status,
    recordsDetected,
    note,
    lastUpdatedAt,
  };
}

function summaryFromError(
  id: string,
  label: string,
  url: string,
  category: LiveSourceSummary['category'],
  activityType: LiveSourceSummary['activityType'],
  error: unknown
): SourceFetchResult {
  const note = error instanceof Error ? error.message.slice(0, 140) : 'Source unavailable';
  return {
    contracts: [],
    summary: buildSourceSummary(id, label, url, category, activityType, 'unavailable', 0, note),
  };
}

export function parseDgsBidsAwardsHtml(html: string): SourceFetchResult {
  const lines = toTextLines(html);
  const sections: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line === 'Description:') {
      if (current.length > 0) sections.push(current);
      current = [line];
      continue;
    }
    if (current.length > 0) {
      current.push(line);
    }
  }
  if (current.length > 0) sections.push(current);

  const contracts: NormalizedContract[] = [];
  let awardedCount = 0;
  let openCount = 0;

  for (const section of sections) {
    const fieldMap = new Map<string, string>();
    let description = '';

    for (let i = 0; i < section.length; i += 1) {
      const line = section[i];
      if (i === 1) {
        description = line;
      }
      if (line.endsWith(':') && i + 1 < section.length) {
        fieldMap.set(line.slice(0, -1), section[i + 1]);
      }
    }

    const status = fieldMap.get('Status') || 'Unknown';
    if (status === 'Awarded') awardedCount += 1;
    if (status === 'Open') openCount += 1;

    const vendor = fieldMap.get('Vendor') || '';
    if (!vendor) continue;

    const start = fieldMap.get('Award Start Date') || fieldMap.get('Bid Closing Date') || '';
    const end = fieldMap.get('Award End Date') || fieldMap.get('Bid Closing Date') || start;
    const bidNo = fieldMap.get('Bid No') || fieldMap.get('ITB/Project No') || '';
    const category = fieldMap.get('Category') || 'Maryland DGS';
    const method = fieldMap.get('Contract Type') || status;

    contracts.push({
      jurisdiction: 'montgomery-md',
      agency: 'Maryland DGS',
      vendor,
      description,
      method,
      amount: 0,
      amountSpent: 0,
      amountLeft: 0,
      startDate: toIso(start),
      endDate: toIso(end),
      sourceUrl: DGS_BIDS_AWARDS_URL,
      contractId: bidNo,
      activityType: status === 'Awarded' ? 'award' : 'solicitation',
      sourceLabel: 'Maryland Department of General Services',
      sourceSystem: 'maryland_dgs_bids_awards',
      vendorAddress: category,
    });
  }

  return {
    contracts,
    summary: buildSourceSummary(
      'maryland_dgs_bids_awards',
      'Maryland DGS Bids & Awards',
      DGS_BIDS_AWARDS_URL,
      'official',
      'awards',
      contracts.length > 0 || openCount > 0 ? 'live' : 'partial',
      awardedCount + openCount,
      `Parsed ${awardedCount} awarded entries and observed ${openCount} open solicitation entries on the DGS page.`
    ),
  };
}

async function fetchDgsBidsAwardsSource(): Promise<SourceFetchResult> {
  const html = await fetchHtml(DGS_BIDS_AWARDS_URL);
  return parseDgsBidsAwardsHtml(html);
}

export function parseMarylandBidsHtml(html: string): SourceFetchResult {
  const anchorMatches = [...html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)];
  const contracts: NormalizedContract[] = [];
  const lowBidderSeen = new Set<string>();

  for (const match of anchorMatches) {
    const text = stripHtml(match[1]).replace(/\s+/g, ' ').trim();
    if (!text.includes('Low Bidder on') || !text.includes(' in Maryland at ')) continue;
    const parsed = text.match(/^(.*?)\s+Low Bidder on\s+(.*?)\s+in Maryland at\s+\$?([\d,]+(?:\.\d+)?)\s+USD$/i);
    if (!parsed) continue;
    const [, vendor, description, amountText] = parsed;
    const key = `${vendor}|${description}|${amountText}`;
    if (lowBidderSeen.has(key)) continue;
    lowBidderSeen.add(key);

    contracts.push({
      jurisdiction: 'montgomery-md',
      agency: 'Maryland Bid Network',
      vendor: vendor.trim(),
      description: description.trim(),
      method: description.includes('RFP') ? 'Competitive' : 'Bid Result',
      amount: parseCurrencyFromText(amountText),
      amountSpent: 0,
      amountLeft: 0,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      sourceUrl: MARYLAND_BIDS_URL,
      contractId: `${vendor}-${description}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80),
      activityType: 'low_bidder',
      sourceLabel: 'Maryland Bid Network',
      sourceSystem: 'maryland_bid_network',
    });
  }

  const updatedMatch = stripHtml(html).match(/Added\/Updated Solicitation Title\s+(\d{2}\/\d{2}\/\d{2})/i);
  const updatedIso = updatedMatch ? parseUsDate(updatedMatch[1]) : undefined;

  return {
    contracts,
    summary: buildSourceSummary(
      'maryland_bid_network',
      'Maryland Bid Network',
      MARYLAND_BIDS_URL,
      'market',
      'low_bidder',
      contracts.length > 0 ? 'live' : 'partial',
      contracts.length,
      'Captured low-bidder and bid-result market intelligence for Maryland vendors.',
      updatedIso
    ),
  };
}

async function fetchMarylandBidsSource(): Promise<SourceFetchResult> {
  const html = await fetchHtml(MARYLAND_BIDS_URL);
  return parseMarylandBidsHtml(html);
}

export function parseBidsUsaMarylandHtml(html: string): SourceFetchResult {
  const text = stripHtml(html).replace(/\s+/g, ' ').trim();
  const lastUpdatedMatch = text.match(/Last updated on ([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2},\s+\d{4})/i);
  const lastUpdatedAt = lastUpdatedMatch ? new Date(lastUpdatedMatch[1]).toISOString().slice(0, 10) : undefined;
  const listingCount = (text.match(/RFP Source: SAM\.GOV Contract Opportunities - Maryland/gi) || []).length || 1;

  return {
    contracts: [],
    summary: buildSourceSummary(
      'bids_usa_maryland_sam',
      'bidsUSA SAM.gov Maryland',
      BIDS_USA_MARYLAND_SAM_URL,
      'market',
      'solicitations',
      'live',
      listingCount,
      'Tracked as solicitation telemetry only. Closing dates and addenda must be confirmed with the issuing agency.',
      lastUpdatedAt
    ),
  };
}

async function fetchBidsUsaSource(): Promise<SourceFetchResult> {
  const html = await fetchHtml(BIDS_USA_MARYLAND_SAM_URL);
  return parseBidsUsaMarylandHtml(html);
}

export async function fetchLiveProcurementContracts(): Promise<{
  contracts: NormalizedContract[];
  provider?: string;
  sourceSummaries: LiveSourceSummary[];
}> {
  const [montgomeryResult, baltimoreResult, dgsResult, marylandBidsResult, bidsUsaResult] = await Promise.allSettled([
    fetchMontgomeryContracts(),
    fetchBaltimoreContracts(),
    fetchDgsBidsAwardsSource(),
    fetchMarylandBidsSource(),
    fetchBidsUsaSource(),
  ]);

  const montgomeryRows = montgomeryResult.status === 'fulfilled' ? montgomeryResult.value : [];
  const baltimoreRows = baltimoreResult.status === 'fulfilled' ? baltimoreResult.value : [];
  const dgsSource = dgsResult.status === 'fulfilled'
    ? dgsResult.value
    : summaryFromError('maryland_dgs_bids_awards', 'Maryland DGS Bids & Awards', DGS_BIDS_AWARDS_URL, 'official', 'awards', dgsResult.reason);
  const marylandBidsSource = marylandBidsResult.status === 'fulfilled'
    ? marylandBidsResult.value
    : summaryFromError('maryland_bid_network', 'Maryland Bid Network', MARYLAND_BIDS_URL, 'market', 'low_bidder', marylandBidsResult.reason);
  const bidsUsaSource = bidsUsaResult.status === 'fulfilled'
    ? bidsUsaResult.value
    : summaryFromError('bids_usa_maryland_sam', 'bidsUSA SAM.gov Maryland', BIDS_USA_MARYLAND_SAM_URL, 'market', 'solicitations', bidsUsaResult.reason);

  if (montgomeryResult.status === 'rejected') {
    console.error('[procurement-live] Montgomery feed error:', montgomeryResult.reason);
  }
  if (baltimoreResult.status === 'rejected') {
    console.error('[procurement-live] Baltimore feed error:', baltimoreResult.reason);
  }
  if (dgsResult.status === 'rejected') {
    console.error('[procurement-live] DGS source error:', dgsResult.reason);
  }
  if (marylandBidsResult.status === 'rejected') {
    console.error('[procurement-live] MarylandBids source error:', marylandBidsResult.reason);
  }
  if (bidsUsaResult.status === 'rejected') {
    console.error('[procurement-live] bidsUSA source error:', bidsUsaResult.reason);
  }

  const contracts = [
    ...normalizeMontgomery(montgomeryRows).map((contract) => ({
      ...contract,
      activityType: 'contract' as const,
      sourceLabel: 'Montgomery County Open Data',
      sourceSystem: 'montgomery_county_socrata',
    })),
    ...normalizeBaltimore(baltimoreRows ?? []),
    ...dgsSource.contracts,
    ...marylandBidsSource.contracts,
  ];
  const sourceSummaries = [
    buildSourceSummary(
      'montgomery_county_socrata',
      'Montgomery County Open Data',
      'https://data.montgomerycountymd.gov/Government/Award-Solicitations/ku39-t2wt',
      'official',
      'contracts',
      montgomeryRows.length > 0 ? 'live' : 'unavailable',
      montgomeryRows.length,
      'County award/solicitation data exposed via Socrata API.'
    ),
    buildSourceSummary(
      'baltimore_city_arcgis',
      'Baltimore City Bureau of Purchases',
      'https://services1.arcgis.com/UWYHeuuJISiGmgXx/arcgis/rest/services/Baltimore_CityContracts_Bureau_of_Purchases_Department_of_Finance/FeatureServer/0',
      'official',
      'contracts',
      (baltimoreRows ?? []).length > 0 ? 'live' : 'unavailable',
      (baltimoreRows ?? []).length,
      'Blanket-contract and spend data exposed via ArcGIS service.'
    ),
    dgsSource.summary,
    marylandBidsSource.summary,
    bidsUsaSource.summary,
  ];
  return {
    contracts,
    provider: contracts.length > 0 ? 'official_feeds + maryland_market_intel' : undefined,
    sourceSummaries,
  };
}

function mapMethod(methodText: string, description: string, amount: number): ProcurementMethod {
  const m = `${methodText} ${description}`.toLowerCase();
  if (m.includes('emergency') || m.includes('emerg')) return 'Emergency';
  if (m.includes('sole') || m.includes('single source')) return 'Sole Source';
  if (m.includes('expedit')) return 'Expedited';
  if (amount > 0 && amount < SMALL_PROCUREMENT_THRESHOLD) return 'Small Procurement';
  if (m.includes('open solicitation') || m.includes('rfp') || m.includes('competitive') || m.includes('contract')) {
    return 'Competitive';
  }
  return 'Unknown';
}

export async function fetchLiveProcurementRecords(): Promise<ProcurementRecord[]> {
  const { contracts } = await fetchLiveProcurementContracts();
  return contracts.map((contract, index) => {
    const rawId = `${contract.jurisdiction}-${contract.contractId}-${contract.vendor}-${contract.startDate}-${index}`;
    const id = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120) || `live-${index}`;
    return {
      id,
      agency: contract.agency,
      vendor: contract.vendor,
      amount: contract.amount,
      method: mapMethod(contract.method, contract.description, contract.amount),
      category: contract.description || contract.method || undefined,
      startDate: toIsoDate(contract.startDate),
      currentEndDate: toIsoDate(contract.endDate),
      jurisdiction: contract.jurisdiction === 'baltimore-city' ? 'Baltimore City' : 'Maryland State',
      sourceUrl: contract.sourceUrl,
      vendorAddress: contract.vendorAddress,
      vendorPhone: contract.vendorPhone,
      boardActionDate: toIsoDate(contract.startDate),
      activityType: contract.activityType,
      sourceLabel: contract.sourceLabel,
      sourceSystem: contract.sourceSystem,
    } satisfies ProcurementRecord;
  });
}

function flagLongDuration(contracts: NormalizedContract[]): LiveRiskFlag[] {
  return contracts
    .filter((c) => c.startDate && c.endDate && daysBetweenIso(c.startDate, c.endDate) > 365 * 3)
    .slice(0, 80)
    .map((c) => ({
      agency: c.agency,
      vendor: c.vendor,
      amount: c.amount,
      rule: 'Contract term exceeds 3 years',
      citation: 'Duration Risk Control',
      severity: 'medium',
      detail: `Contract ${c.contractId || '(no id)'} spans more than 1,095 days and should be reviewed for renewal/procurement controls.`,
      sourceUrl: c.sourceUrl,
      contractDate: c.startDate,
    }));
}

function flagVendorConcentration(contracts: NormalizedContract[]): LiveRiskFlag[] {
  const grouped = new Map<string, NormalizedContract[]>();
  for (const c of contracts) {
    const key = `${c.jurisdiction}|${c.agency}|${c.vendor}`;
    const list = grouped.get(key) || [];
    list.push(c);
    grouped.set(key, list);
  }

  const flags: LiveRiskFlag[] = [];
  for (const [, list] of grouped) {
    if (list.length < CONCENTRATION_MIN_CONTRACTS) continue;
    const total = list.reduce((sum, c) => sum + c.amount, 0);
    const sample = list[0];
    flags.push({
      agency: sample.agency,
      vendor: sample.vendor,
      amount: total,
      rule: `Vendor concentration (${list.length} active contracts)`,
      citation: 'Concentration Risk Control',
      severity: list.length >= 8 ? 'high' : 'medium',
      detail: `Same vendor appears ${list.length} times in the current live feed for the same agency scope.`,
      sourceUrl: sample.sourceUrl,
      contractDate: sample.startDate,
    });
  }

  return flags.slice(0, 120);
}

function flagPotentialSplitContracts(contracts: NormalizedContract[]): LiveRiskFlag[] {
  const eligible = contracts.filter(
    (c) => c.jurisdiction === 'baltimore-city' && c.amount > 0 && c.amount < SMALL_PROCUREMENT_THRESHOLD && c.startDate
  );

  const grouped = new Map<string, NormalizedContract[]>();
  for (const c of eligible) {
    const key = `${c.agency}|${c.vendor}`;
    const list = grouped.get(key) || [];
    list.push(c);
    grouped.set(key, list);
  }

  const flags: LiveRiskFlag[] = [];
  for (const [, list] of grouped) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    for (let i = 0; i < sorted.length; i += 1) {
      const origin = sorted[i];
      const window = sorted.filter(
        (x) => Math.abs(new Date(x.startDate).getTime() - new Date(origin.startDate).getTime()) <= 90 * 86_400_000
      );
      if (window.length < 2) continue;
      const combined = window.reduce((sum, c) => sum + c.amount, 0);
      if (combined <= SMALL_PROCUREMENT_THRESHOLD) continue;
      flags.push({
        agency: origin.agency,
        vendor: origin.vendor,
        amount: combined,
        rule: `Potential split-contract pattern (${window.length} contracts in 90 days)`,
        citation: 'COMAR 21.05.07.05(A)',
        severity: 'high',
        detail: `Multiple sub-$${SMALL_PROCUREMENT_THRESHOLD.toLocaleString()} awards combine to $${Math.round(combined).toLocaleString()} in a 90-day window.`,
        sourceUrl: origin.sourceUrl,
        contractDate: origin.startDate,
      });
      break;
    }
  }

  return flags.slice(0, 80);
}

function flagHighValueBaltimore(contracts: NormalizedContract[]): LiveRiskFlag[] {
  return contracts
    .filter((c) => c.jurisdiction === 'baltimore-city' && c.amount >= HIGH_VALUE_BALT_THRESHOLD)
    .slice(0, 60)
    .map((c) => ({
      agency: c.agency,
      vendor: c.vendor,
      amount: c.amount,
      rule: 'High-value blanket contract requires elevated review',
      citation: 'Baltimore Financial Oversight Review',
      severity: c.amount >= 1_000_000 ? 'critical' : 'high',
      detail: `Blanket contract value is $${Math.round(c.amount).toLocaleString()} in live City contract data.`,
      sourceUrl: c.sourceUrl,
      contractDate: c.startDate,
    }));
}

function flagBudgetNearExhaustion(contracts: NormalizedContract[]): LiveRiskFlag[] {
  return contracts
    .filter((c) => c.jurisdiction === 'baltimore-city' && c.amount > 0)
    .filter((c) => c.amountSpent / c.amount >= 0.9 && c.amountLeft <= 10_000)
    .slice(0, 50)
    .map((c) => ({
      agency: c.agency,
      vendor: c.vendor,
      amount: c.amount,
      rule: 'Budget near exhaustion',
      citation: 'Spend Utilization Control',
      severity: 'medium',
      detail: `Spent $${Math.round(c.amountSpent).toLocaleString()} of $${Math.round(c.amount).toLocaleString()} with $${Math.round(c.amountLeft).toLocaleString()} remaining.`,
      sourceUrl: c.sourceUrl,
      contractDate: c.startDate,
    }));
}

export async function buildLiveProcurementScanResult(): Promise<LiveScanResult> {
  const asOf = new Date().toISOString();
  const { contracts, provider, sourceSummaries } = await fetchLiveProcurementContracts();

  let flags: LiveRiskFlag[] = [];
  if (contracts.length > 0) {
    flags = [
      ...flagLongDuration(contracts),
      ...flagVendorConcentration(contracts),
      ...flagPotentialSplitContracts(contracts),
      ...flagHighValueBaltimore(contracts),
      ...flagBudgetNearExhaustion(contracts),
    ];

    const seen = new Set<string>();
    flags = flags.filter((f) => {
      const key = `${f.agency}|${f.vendor}|${f.rule}|${f.contractDate}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    flags = flags
      .sort((a, b) => {
        const sevDiff = severityScore(b.severity) - severityScore(a.severity);
        if (sevDiff !== 0) return sevDiff;
        return b.amount - a.amount;
      })
      .slice(0, 250);
  }

  const strictCitations = ['COMAR 21.05.07.05(A)'];

  return {
    asOf,
    source: contracts.length > 0 || sourceSummaries.some((sourceSummary) => sourceSummary.status === 'live') ? 'live' : 'unavailable',
    provider,
    flags,
    vendorsImpacted: new Set(flags.map((f) => f.vendor)).size,
    totalExposure: flags.reduce((sum, f) => sum + f.amount, 0),
    strictLawShare:
      flags.length > 0
        ? Math.round((flags.filter((f) => strictCitations.includes(f.citation)).length / flags.length) * 100)
        : 0,
    sourceSummaries,
  };
}
