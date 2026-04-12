/**
 * Risk memo field audit
 *
 * Displayed field: Asset address
 * Source: Maryland SDAT real property dataset `ed4q-f8tm`
 * Dataset fields: `mdp_street_address_mdp_field_address` or premise-address fields
 * Classification: Real data
 *
 * Displayed field: Owner name
 * Source: Maryland SDAT Real Property detail/search page linked from `real_property_search_link.url`
 * URL pattern: `https://sdat.dat.maryland.gov/RealProperty/Pages/...`
 * Classification: Real data only when the live SDAT HTML returns an owner name; removed otherwise
 *
 * Displayed field: Zoning code
 * Source: Maryland SDAT real property dataset `ed4q-f8tm`
 * Dataset field: `zoning_code_mdp_field_zoning_sdat_field_45`
 * Classification: Real data
 *
 * Displayed field: Land use classification
 * Source: Maryland SDAT real property dataset `ed4q-f8tm`
 * Dataset field: `land_use_code_mdp_field_lu_desclu_sdat_field_50`
 * Classification: Real data
 *
 * Displayed field: Assessment value
 * Source: Maryland SDAT real property dataset `ed4q-f8tm`
 * Dataset field: `current_assessment_year_total_assessment_sdat_field_172`
 * Classification: Real data
 *
 * Displayed field: Permit history
 * Source: Baltimore City ArcGIS REST `Housing/DHCD_Open_Baltimore_Datasets/MapServer/3`
 * Working query: `.../3/query?where=Address='25 W FAYETTE ST'&outFields=Address,CaseNumber,IssuedDate,Description,ExistingUse,ProposedUse,Cost&returnGeometry=false&f=json`
 * Fields used: `Address`, `CaseNumber`, `IssuedDate`, `Description`, `ExistingUse`, `ProposedUse`, `Cost`
 * Classification: Real data when the ArcGIS endpoint returns JSON
 *
 * Displayed field: Code enforcement violations
 * Source: Baltimore City ArcGIS REST `Housing/dmxPermitsCodeEnforcement/MapServer/11` (`FTA Citation - $1,000`)
 * Working query: `.../11/query?where=HouseNum='2210' AND StreetName='FAYETTE' AND Direction='W' AND StreetAttr='ST'&outFields=HouseNum,Direction,StreetName,StreetAttr,CitationNum,CitationStatus,ViolationText,DateNotice,BlockLot&returnGeometry=false&f=json`
 * Fields used: `HouseNum`, `Direction`, `StreetName`, `StreetAttr`, `CitationNum`, `CitationStatus`, `ViolationText`, `DateNotice`, `BlockLot`
 * Classification: Real data when the ArcGIS endpoint returns JSON
 *
 * Displayed field: Vacant building notices
 * Source: Baltimore City ArcGIS REST `Housing/DHCD_Open_Baltimore_Datasets/FeatureServer/1` (`Vacant Building Notice - Open`)
 * Working query: `.../1/query?where=Address='2210 W FAYETTE ST'&outFields=Address,NoticeNum,DateNotice,DateCancel,DateAbate,NT,OWNER_ABBR,BLOCKLOT&returnGeometry=false&f=json`
 * Fields used: `Address`, `NoticeNum`, `DateNotice`, `DateCancel`, `DateAbate`, `NT`, `OWNER_ABBR`, `BLOCKLOT`
 * Classification: Real data when the ArcGIS endpoint returns JSON
 *
 * Displayed field: Environmental violations
 * Source search attempted: Baltimore City ArcGIS service directory and data portal
 * Result: No current machine-readable endpoint was verified during this pass
 * Classification: Not included in memo output
 *
 * Displayed field: Decision
 * Source: Computed decision based only on verified field returns and verified query outcomes
 * Classification: Computed signal. If the source set is incomplete or unavailable, the memo must say:
 * "Insufficient data to generate a risk determination. Manual review required."
 *
 * Removed fields from prior memo:
 * - Discrepancy code: rules-based signal with no direct public-record field
 * - Estimated recovery / exposure proxy: hardcoded financial estimate, removed
 * - Generated structural rationale tied to fake discrepancy logic: removed
 * - Placeholder owner strings like "Unknown Owner": removed
 */
import { prisma } from '@/lib/prisma';
import { buildDealRecordData } from '@/lib/deal-records';

export type ForensicMode = 'asset' | 'compliance';

export type ForensicLookupStatus = 'success' | 'empty' | 'unavailable';

export type ForensicDatasetStatus = 'returned_data' | 'no_records_found' | 'unavailable';

export type ForensicSourceRecord = {
  label: string;
  url: string;
  detail?: string;
};

export type ForensicLookupRecord = {
  id:
    | 'maryland_property_dataset'
    | 'maryland_sdat_owner'
    | 'baltimore_building_permits'
    | 'baltimore_code_violations'
    | 'baltimore_vacant_buildings';
  label: string;
  url: string;
  status: ForensicLookupStatus;
  note: string;
};

export type PermitRecord = {
  address: string;
  caseNumber: string;
  issuedDate?: string;
  description?: string;
  existingUse?: string;
  proposedUse?: string;
  cost?: number;
};

export type CodeViolationRecord = {
  address: string;
  citationNumber: string;
  citationStatus?: string;
  violationText: string;
  noticeDate?: string;
  blockLot?: string;
};

export type VacantNoticeRecord = {
  address: string;
  noticeNumber: string;
  noticeDate?: string;
  cancelDate?: string;
  abateDate?: string;
  noticeType?: string;
  ownerAbbreviation?: string;
  blockLot?: string;
};

export type ForensicDatasetResult<T> = {
  source: ForensicSourceRecord;
  status: ForensicDatasetStatus;
  note: string;
  records: T[];
};

export type ForensicDecision = {
  outcome: 'manual_review_required' | 'caution' | 'escalate' | 'proceed';
  summary: string;
  rationale: string[];
  computedFrom: string[];
  drivers: string[];
};

export type ForensicReport = {
  status: 'success' | 'not_found' | 'error';
  mode: ForensicMode;
  refId: string;
  runAt: string;
  queryAddress: string;
  subject: {
    address: string;
    owner?: string;
    zoning?: string;
    landUse?: string;
    assessmentValue?: number;
    taxRecordLabel?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  sources: {
    address?: ForensicSourceRecord;
    owner?: ForensicSourceRecord;
    zoning?: ForensicSourceRecord;
    landUse?: ForensicSourceRecord;
    assessmentValue?: ForensicSourceRecord;
  };
  datasets: {
    permits: ForensicDatasetResult<PermitRecord>;
    codeViolations: ForensicDatasetResult<CodeViolationRecord>;
    vacantBuildingNotices: ForensicDatasetResult<VacantNoticeRecord>;
  };
  queriedSources: ForensicLookupRecord[];
  decision: ForensicDecision;
  discrepancy: {
    code: 'REMOVED_UNVERIFIED_SIGNAL';
    label: string;
    details: string;
    cityRecordMonthly: 0;
    actualUsageMonthly: 0;
    estimatedRecovery: 0;
    actualUsageLabel: 'Not Available';
  };
  lien: null;
  epa: null;
  logs: string[];
};

type ParsedAddress = {
  houseNumber: string | null;
  direction: string | null;
  streetName: string | null;
  streetType: string | null;
  zipCode: string | null;
};

type ArcGisFeature<T extends Record<string, unknown>> = {
  attributes: T;
};

const SOCRATA_API_URL = 'https://opendata.maryland.gov/resource/ed4q-f8tm.json';
const MARYLAND_PROPERTY_DATASET_URL = 'https://opendata.maryland.gov/resource/ed4q-f8tm.json';
const SDAT_PROPERTY_SEARCH_URL = 'https://sdat.dat.maryland.gov/RealProperty/Pages/default.aspx';
const BALTIMORE_BUILDING_PERMITS_URL =
  'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/MapServer/3/query';
const BALTIMORE_BUILDING_PERMITS_LAYER_URL =
  'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/MapServer/3';
const BALTIMORE_CODE_VIOLATIONS_URL =
  'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/dmxPermitsCodeEnforcement/MapServer/11/query';
const BALTIMORE_CODE_VIOLATIONS_LAYER_URL =
  'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/dmxPermitsCodeEnforcement/MapServer/11';
const BALTIMORE_VACANT_BUILDINGS_URL =
  'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/FeatureServer/1/query';
const BALTIMORE_VACANT_BUILDINGS_LAYER_URL =
  'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/FeatureServer/1';

const LEGACY_DISCREPANCY = {
  code: 'REMOVED_UNVERIFIED_SIGNAL' as const,
  label: 'Unverified discrepancy signal removed',
  details: 'Legacy discrepancy and recovery estimates were removed because they were not backed by a verified public source.',
  cityRecordMonthly: 0 as const,
  actualUsageMonthly: 0 as const,
  estimatedRecovery: 0 as const,
  actualUsageLabel: 'Not Available' as const,
};

const INSUFFICIENT_DATA_MESSAGE = 'Insufficient data to generate a risk determination. Manual review required.';

const STREET_TYPE_ALIASES: Record<string, string[]> = {
  ST: ['ST', 'STREET'],
  STREET: ['STREET', 'ST'],
  RD: ['RD', 'ROAD'],
  ROAD: ['ROAD', 'RD'],
  AVE: ['AVE', 'AVENUE'],
  AVENUE: ['AVENUE', 'AVE'],
  BLVD: ['BLVD', 'BOULEVARD'],
  BOULEVARD: ['BOULEVARD', 'BLVD'],
  DR: ['DR', 'DRIVE'],
  DRIVE: ['DRIVE', 'DR'],
  LN: ['LN', 'LANE'],
  LANE: ['LANE', 'LN'],
  CT: ['CT', 'COURT'],
  COURT: ['COURT', 'CT'],
  PL: ['PL', 'PLACE'],
  PLACE: ['PLACE', 'PL'],
  PKWY: ['PKWY', 'PARKWAY'],
  PARKWAY: ['PARKWAY', 'PKWY'],
  CIR: ['CIR', 'CIRCLE'],
  CIRCLE: ['CIRCLE', 'CIR'],
  TER: ['TER', 'TERRACE'],
  TERRACE: ['TERRACE', 'TER'],
  WAY: ['WAY'],
};

function toRefId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${date}-${suffix}`;
}

function firstString(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function normalizeAddress(raw: string): string {
  return raw
    .toUpperCase()
    .replace('BALTIMORE', '')
    .replace('MD', '')
    .replace(/\d{5}/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalStreetTypeToken(token: string): string {
  const upper = token.toUpperCase();
  for (const [key, values] of Object.entries(STREET_TYPE_ALIASES)) {
    if (key === upper || values.includes(upper)) {
      return values[values.length - 1] ?? upper;
    }
  }
  return upper;
}

function normalizeForMatch(value: string): string {
  const tokens = value
    .toUpperCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

  return tokens
    .map((token) => (STREET_TYPE_ALIASES[token] ? canonicalStreetTypeToken(token) : token))
    .join(' ');
}

function buildAddressFromPremiseFields(row: Record<string, unknown>): string {
  const numberRaw = firstString(row, ['premise_address_number_mdp_field_premsnum_sdat_field_20']);
  const direction = firstString(row, ['premise_address_direction_mdp_field_premsdir_sdat_field_22']);
  const name = firstString(row, ['premise_address_name_mdp_field_premsnam_sdat_field_23']);
  const type = firstString(row, ['premise_address_type_mdp_field_premstyp_sdat_field_24']);
  const city = firstString(row, ['premise_address_city_mdp_field_premcity_sdat_field_25']);
  const zip = firstString(row, ['premise_address_zip_code_mdp_field_premzip_sdat_field_26']);

  const number = numberRaw ? String(Number(numberRaw)) : '';
  const line1 = [number, direction, name, type].filter(Boolean).join(' ').trim();
  const line2 = [city, zip].filter(Boolean).join(', ').trim();
  return [line1, line2].filter(Boolean).join(', ').trim();
}

function parseAddressParts(raw: string): ParsedAddress {
  const normalized = normalizeForMatch(raw)
    .replace(/\bBALTIMORE\b/g, ' ')
    .replace(/\bMD\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const zipMatch = normalized.match(/\b(\d{5})\b/);
  const zipCode = zipMatch?.[1] ?? null;
  const withoutZip = zipCode ? normalized.replace(zipCode, '').trim() : normalized;
  const tokens = withoutZip.split(' ').filter(Boolean);

  if (tokens.length === 0) {
    return {
      houseNumber: null,
      direction: null,
      streetName: null,
      streetType: null,
      zipCode,
    };
  }

  const houseNumber = /^\d+[A-Z-]*$/.test(tokens[0]) ? tokens.shift() ?? null : null;
  const directionToken = tokens[0] && ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'].includes(tokens[0]) ? tokens.shift() ?? null : null;
  const possibleType = tokens[tokens.length - 1] ?? null;
  const streetType = possibleType && STREET_TYPE_ALIASES[possibleType] ? possibleType : null;
  const nameTokens = streetType ? tokens.slice(0, -1) : tokens;

  return {
    houseNumber,
    direction: directionToken,
    streetName: nameTokens.length > 0 ? nameTokens.join(' ') : null,
    streetType,
    zipCode,
  };
}

function zeroPadHouseNumber(value: string | null): string | null {
  if (!value) return null;
  const numericPart = value.match(/\d+/)?.[0];
  if (!numericPart) return null;
  return numericPart.padStart(5, '0');
}

function buildStreetTypeCandidates(streetType: string | null): string[] {
  if (!streetType) return [];
  const candidates = STREET_TYPE_ALIASES[streetType] ?? [streetType];
  return Array.from(new Set(candidates.map((candidate) => candidate.toUpperCase())));
}

function parseNumber(value: string) {
  const n = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function parseCoordinate(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function extractCoordinates(row: Record<string, unknown>) {
  const directLat =
    parseCoordinate(row.latitude) ??
    parseCoordinate(row.lat) ??
    parseCoordinate(row.y) ??
    parseCoordinate(row.location_1_latitude) ??
    parseCoordinate(row.mdp_latitude_mdp_field_digycord_converted_to_wgs84);
  const directLng =
    parseCoordinate(row.longitude) ??
    parseCoordinate(row.lng) ??
    parseCoordinate(row.lon) ??
    parseCoordinate(row.x) ??
    parseCoordinate(row.location_1_longitude) ??
    parseCoordinate(row.mdp_longitude_mdp_field_digxcord_converted_to_wgs84);

  if (directLat !== undefined && directLng !== undefined) {
    return { latitude: directLat, longitude: directLng };
  }

  return { latitude: undefined, longitude: undefined };
}

async function fetchJson(url: string, headers?: Record<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) throw new Error(`Source request failed: ${res.status}`);
    const body = await res.text();

    if (!contentType.includes('application/json')) {
      const trimmed = body.trim();
      if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
        throw new Error('Source returned non-JSON content.');
      }
    }

    try {
      return JSON.parse(body);
    } catch {
      throw new Error('Source returned non-JSON content.');
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url: string, headers?: Record<string, string>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) throw new Error(`Source request failed: ${res.status}`);
    if (!contentType.toLowerCase().includes('text/html')) {
      throw new Error('Source returned non-HTML content.');
    }
    return res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function isoDate(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return new Date(value).toISOString();
}

function escapeArcGisString(value: string) {
  return value.replace(/'/g, "''");
}

function toCityAddress(parsed: ParsedAddress): string | null {
  if (!parsed.houseNumber || !parsed.streetName) return null;
  return [parsed.houseNumber, parsed.direction, parsed.streetName, parsed.streetType ? canonicalStreetTypeToken(parsed.streetType) : null]
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function fetchArcGisQuery<T extends Record<string, unknown>>(url: string, params: URLSearchParams, headers?: Record<string, string>) {
  const payload = await fetchJson(`${url}?${params.toString()}`, headers);
  const features = Array.isArray(payload?.features) ? (payload.features as ArcGisFeature<T>[]) : [];
  return features;
}

async function fetchPropertyRecords(address: string, headers?: Record<string, string>) {
  const parsed = parseAddressParts(address);
  const streetName = parsed.streetName;

  if (!streetName) {
    return [] as Record<string, unknown>[];
  }

  const attemptParamsList: URLSearchParams[] = [];
  const base = new URLSearchParams({
    county_name_mdp_field_cntyname: 'Baltimore City',
    premise_address_city_mdp_field_premcity_sdat_field_25: 'BALTIMORE',
    $limit: '25',
  });

  if (parsed.zipCode) {
    base.set('premise_address_zip_code_mdp_field_premzip_sdat_field_26', parsed.zipCode);
  }

  const streetTypes = buildStreetTypeCandidates(parsed.streetType);
  const houseNumber = zeroPadHouseNumber(parsed.houseNumber);

  if (houseNumber) {
    if (streetTypes.length > 0) {
      for (const streetType of streetTypes) {
        const params = new URLSearchParams(base);
        params.set('premise_address_number_mdp_field_premsnum_sdat_field_20', houseNumber);
        params.set('premise_address_name_mdp_field_premsnam_sdat_field_23', streetName);
        params.set('premise_address_type_mdp_field_premstyp_sdat_field_24', streetType);
        attemptParamsList.push(params);
      }
    }

    const params = new URLSearchParams(base);
    params.set('premise_address_number_mdp_field_premsnum_sdat_field_20', houseNumber);
    params.set('premise_address_name_mdp_field_premsnam_sdat_field_23', streetName);
    attemptParamsList.push(params);
  }

  if (streetTypes.length > 0) {
    for (const streetType of streetTypes) {
      const params = new URLSearchParams(base);
      params.set('premise_address_name_mdp_field_premsnam_sdat_field_23', streetName);
      params.set('premise_address_type_mdp_field_premstyp_sdat_field_24', streetType);
      params.set('$limit', '50');
      attemptParamsList.push(params);
    }
  }

  const fallback = new URLSearchParams(base);
  fallback.set('premise_address_name_mdp_field_premsnam_sdat_field_23', streetName);
  fallback.set('$limit', '50');
  attemptParamsList.push(fallback);

  for (const params of attemptParamsList) {
    const records = await fetchJson(`${SOCRATA_API_URL}?${params.toString()}`, headers);
    if (Array.isArray(records) && records.length > 0) {
      return records as Record<string, unknown>[];
    }
  }

  return [] as Record<string, unknown>[];
}

function selectBestRecord(records: Record<string, unknown>[], address: string) {
  const normalizedSearch = normalizeForMatch(normalizeAddress(address));
  const parsedSearch = parseAddressParts(address);
  const paddedHouseNumber = zeroPadHouseNumber(parsedSearch.houseNumber);

  const exactMatch = records.find((row) => {
    const candidateAddress =
      firstString(row, ['mdp_street_address_mdp_field_address']) || buildAddressFromPremiseFields(row);
    return normalizeForMatch(normalizeAddress(candidateAddress)).includes(normalizedSearch);
  });

  if (exactMatch) return exactMatch;

  if (paddedHouseNumber && parsedSearch.streetName) {
    const numberAndStreetMatch = records.find((row) => {
      const rowNumber = firstString(row, ['premise_address_number_mdp_field_premsnum_sdat_field_20']);
      const rowStreet = firstString(row, ['premise_address_name_mdp_field_premsnam_sdat_field_23']);
      return rowNumber === paddedHouseNumber && normalizeForMatch(rowStreet) === normalizeForMatch(parsedSearch.streetName || '');
    });

    if (numberAndStreetMatch) return numberAndStreetMatch;
  }

  return null;
}

function buildBaseLookups(): ForensicLookupRecord[] {
  return [
    {
      id: 'maryland_property_dataset',
      label: 'Maryland SDAT Property Dataset',
      url: MARYLAND_PROPERTY_DATASET_URL,
      status: 'empty',
      note: 'Query not yet run.',
    },
    {
      id: 'maryland_sdat_owner',
      label: 'Maryland SDAT Property Detail',
      url: SDAT_PROPERTY_SEARCH_URL,
      status: 'empty',
      note: 'Owner lookup not yet attempted.',
    },
    {
      id: 'baltimore_building_permits',
      label: 'Baltimore City Building Permits',
      url: BALTIMORE_BUILDING_PERMITS_LAYER_URL,
      status: 'empty',
      note: 'Permit lookup not yet attempted.',
    },
    {
      id: 'baltimore_code_violations',
      label: 'Baltimore City Code Enforcement Citations',
      url: BALTIMORE_CODE_VIOLATIONS_LAYER_URL,
      status: 'empty',
      note: 'Code-violation lookup not yet attempted.',
    },
    {
      id: 'baltimore_vacant_buildings',
      label: 'Baltimore City Vacant Building Notices',
      url: BALTIMORE_VACANT_BUILDINGS_LAYER_URL,
      status: 'empty',
      note: 'Vacant-building lookup not yet attempted.',
    },
  ];
}

function setLookup(
  lookups: ForensicLookupRecord[],
  id: ForensicLookupRecord['id'],
  status: ForensicLookupStatus,
  note: string,
  url?: string
) {
  const match = lookups.find((entry) => entry.id === id);
  if (!match) return;
  match.status = status;
  match.note = note;
  if (url) match.url = url;
}

function parseOwnerFromSdatHtml(html: string): string | null {
  const patterns = [
    /txtOwnerName_\d+"[^>]*>([^<]+)</i,
    /lblOwnerName_\d+"[^>]*>([^<]+)</i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const owner = match?.[1]?.replace(/\s+/g, ' ').trim();
    if (owner) return owner;
  }

  return null;
}

async function fetchOwnerName(row: Record<string, unknown>, headers?: Record<string, string>) {
  const detailUrl =
    typeof row.real_property_search_link === 'object' &&
    row.real_property_search_link &&
    typeof (row.real_property_search_link as { url?: unknown }).url === 'string'
      ? (row.real_property_search_link as { url: string }).url
      : null;

  if (!detailUrl) {
    return {
      owner: null,
      lookup: {
        status: 'empty' as const,
        note: 'No SDAT property detail link was present on the Maryland dataset record.',
        url: SDAT_PROPERTY_SEARCH_URL,
      },
    };
  }

  try {
    const html = await fetchText(detailUrl, headers);
    const owner = parseOwnerFromSdatHtml(html);
    if (!owner) {
      return {
        owner: null,
        lookup: {
          status: 'empty' as const,
          note: 'SDAT property detail page returned but no owner name could be parsed.',
          url: detailUrl,
        },
      };
    }

    return {
      owner,
      lookup: {
        status: 'success' as const,
        note: 'Owner name parsed from the live SDAT property detail page.',
        url: detailUrl,
      },
    };
  } catch (error) {
    return {
      owner: null,
      lookup: {
        status: 'unavailable' as const,
        note: error instanceof Error ? error.message : 'SDAT owner lookup failed.',
        url: detailUrl,
      },
    };
  }
}

function emptyDataset<T>(source: ForensicSourceRecord): ForensicDatasetResult<T> {
  return {
    source,
    status: 'unavailable',
    note: 'Query not run.',
    records: [],
  };
}

function isAddressMatch(candidate: string, target: string) {
  return normalizeForMatch(candidate) === normalizeForMatch(target);
}

async function queryPermits(address: string, headers: Record<string, string> | undefined, lookups: ForensicLookupRecord[]) {
  const source: ForensicSourceRecord = {
    label: 'Baltimore City Building Permits',
    url: BALTIMORE_BUILDING_PERMITS_LAYER_URL,
    detail: 'Fields: Address, CaseNumber, IssuedDate, Description, ExistingUse, ProposedUse, Cost',
  };

  const parsed = parseAddressParts(address);
  const canonical = toCityAddress(parsed);

  if (!canonical) {
    setLookup(lookups, 'baltimore_building_permits', 'empty', 'Address could not be normalized for permit lookup.');
    return {
      source,
      status: 'no_records_found' as const,
      note: 'Address could not be normalized for permit lookup.',
      records: [],
    };
  }

  const exactParams = new URLSearchParams({
    where: `Address = '${escapeArcGisString(canonical)}'`,
    outFields: 'Address,CaseNumber,IssuedDate,Description,ExistingUse,ProposedUse,Cost',
    returnGeometry: 'false',
    f: 'json',
  });

  try {
    let features = await fetchArcGisQuery<Record<string, unknown>>(BALTIMORE_BUILDING_PERMITS_URL, exactParams, headers);

    if (features.length === 0 && parsed.houseNumber && parsed.streetName) {
      const fallbackParams = new URLSearchParams({
        where: `Address like '${escapeArcGisString(parsed.houseNumber)}%${escapeArcGisString(parsed.streetName)}%'`,
        outFields: 'Address,CaseNumber,IssuedDate,Description,ExistingUse,ProposedUse,Cost',
        returnGeometry: 'false',
        f: 'json',
      });
      features = await fetchArcGisQuery<Record<string, unknown>>(BALTIMORE_BUILDING_PERMITS_URL, fallbackParams, headers);
      features = features.filter((feature) => isAddressMatch(firstString(feature.attributes, ['Address']), canonical));
    }

    const records = features
      .map((feature) => ({
        address: firstString(feature.attributes, ['Address']),
        caseNumber: firstString(feature.attributes, ['CaseNumber']),
        issuedDate: isoDate(feature.attributes.IssuedDate),
        description: firstString(feature.attributes, ['Description']) || undefined,
        existingUse: firstString(feature.attributes, ['ExistingUse']) || undefined,
        proposedUse: firstString(feature.attributes, ['ProposedUse']) || undefined,
        cost:
          typeof feature.attributes.Cost === 'number' && Number.isFinite(feature.attributes.Cost)
            ? feature.attributes.Cost
            : undefined,
      }))
      .filter((record) => record.address && record.caseNumber);

    if (records.length === 0) {
      setLookup(lookups, 'baltimore_building_permits', 'empty', 'Queried successfully; no permit records found for the address.');
      return {
        source,
        status: 'no_records_found' as const,
        note: 'Queried successfully; no permit records found for the address.',
        records: [],
      };
    }

    setLookup(lookups, 'baltimore_building_permits', 'success', `Queried successfully; ${records.length} permit record(s) returned.`);
    return {
      source,
      status: 'returned_data' as const,
      note: `Queried successfully; ${records.length} permit record(s) returned.`,
      records,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Permit lookup failed.';
    setLookup(lookups, 'baltimore_building_permits', 'unavailable', message);
    return {
      source,
      status: 'unavailable' as const,
      note: message,
      records: [],
    };
  }
}

async function queryVacantBuildingNotices(address: string, headers: Record<string, string> | undefined, lookups: ForensicLookupRecord[]) {
  const source: ForensicSourceRecord = {
    label: 'Baltimore City Vacant Building Notice - Open',
    url: BALTIMORE_VACANT_BUILDINGS_LAYER_URL,
    detail: 'Fields: Address, NoticeNum, DateNotice, DateCancel, DateAbate, NT, OWNER_ABBR, BLOCKLOT',
  };

  const parsed = parseAddressParts(address);
  const canonical = toCityAddress(parsed);

  if (!canonical) {
    setLookup(lookups, 'baltimore_vacant_buildings', 'empty', 'Address could not be normalized for vacant-building lookup.');
    return {
      source,
      status: 'no_records_found' as const,
      note: 'Address could not be normalized for vacant-building lookup.',
      records: [],
    };
  }

  const exactParams = new URLSearchParams({
    where: `Address = '${escapeArcGisString(canonical)}'`,
    outFields: 'Address,NoticeNum,DateNotice,DateCancel,DateAbate,NT,OWNER_ABBR,BLOCKLOT',
    returnGeometry: 'false',
    f: 'json',
  });

  try {
    let features = await fetchArcGisQuery<Record<string, unknown>>(BALTIMORE_VACANT_BUILDINGS_URL, exactParams, headers);

    if (features.length === 0 && parsed.houseNumber && parsed.streetName) {
      const fallbackParams = new URLSearchParams({
        where: `Address like '${escapeArcGisString(parsed.houseNumber)}%${escapeArcGisString(parsed.streetName)}%'`,
        outFields: 'Address,NoticeNum,DateNotice,DateCancel,DateAbate,NT,OWNER_ABBR,BLOCKLOT',
        returnGeometry: 'false',
        f: 'json',
      });
      features = await fetchArcGisQuery<Record<string, unknown>>(BALTIMORE_VACANT_BUILDINGS_URL, fallbackParams, headers);
      features = features.filter((feature) => isAddressMatch(firstString(feature.attributes, ['Address']), canonical));
    }

    const records = features
      .map((feature) => ({
        address: firstString(feature.attributes, ['Address']),
        noticeNumber: firstString(feature.attributes, ['NoticeNum']),
        noticeDate: isoDate(feature.attributes.DateNotice),
        cancelDate: isoDate(feature.attributes.DateCancel),
        abateDate: isoDate(feature.attributes.DateAbate),
        noticeType: firstString(feature.attributes, ['NT']) || undefined,
        ownerAbbreviation: firstString(feature.attributes, ['OWNER_ABBR']) || undefined,
        blockLot: firstString(feature.attributes, ['BLOCKLOT']) || undefined,
      }))
      .filter((record) => record.address && record.noticeNumber);

    if (records.length === 0) {
      setLookup(lookups, 'baltimore_vacant_buildings', 'empty', 'Queried successfully; no open vacant-building notice records found for the address.');
      return {
        source,
        status: 'no_records_found' as const,
        note: 'Queried successfully; no open vacant-building notice records found for the address.',
        records: [],
      };
    }

    setLookup(lookups, 'baltimore_vacant_buildings', 'success', `Queried successfully; ${records.length} vacant-building notice record(s) returned.`);
    return {
      source,
      status: 'returned_data' as const,
      note: `Queried successfully; ${records.length} vacant-building notice record(s) returned.`,
      records,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Vacant-building lookup failed.';
    setLookup(lookups, 'baltimore_vacant_buildings', 'unavailable', message);
    return {
      source,
      status: 'unavailable' as const,
      note: message,
      records: [],
    };
  }
}

function formatViolationAddress(attrs: Record<string, unknown>) {
  const houseNum = firstString(attrs, ['HouseNum']);
  const direction = firstString(attrs, ['Direction']);
  const streetName = firstString(attrs, ['StreetName']);
  const streetAttr = firstString(attrs, ['StreetAttr']);
  return [houseNum, direction, streetName, streetAttr].filter(Boolean).join(' ').trim();
}

async function queryCodeViolations(address: string, headers: Record<string, string> | undefined, lookups: ForensicLookupRecord[]) {
  const source: ForensicSourceRecord = {
    label: 'Baltimore City FTA Citation - $1,000',
    url: BALTIMORE_CODE_VIOLATIONS_LAYER_URL,
    detail: 'Fields: HouseNum, Direction, StreetName, StreetAttr, CitationNum, CitationStatus, ViolationText, DateNotice, BlockLot',
  };

  const parsed = parseAddressParts(address);

  if (!parsed.houseNumber || !parsed.streetName) {
    setLookup(lookups, 'baltimore_code_violations', 'empty', 'Address could not be normalized for code-violation lookup.');
    return {
      source,
      status: 'no_records_found' as const,
      note: 'Address could not be normalized for code-violation lookup.',
      records: [],
    };
  }

  const streetAttrCandidates = buildStreetTypeCandidates(parsed.streetType);
  const whereParts = [
    `HouseNum = '${escapeArcGisString(parsed.houseNumber)}'`,
    `StreetName = '${escapeArcGisString(parsed.streetName)}'`,
  ];

  if (parsed.direction) {
    whereParts.push(`Direction = '${escapeArcGisString(parsed.direction)}'`);
  }

  if (streetAttrCandidates.length > 0) {
    whereParts.push(
      `(${streetAttrCandidates.map((candidate) => `StreetAttr = '${escapeArcGisString(candidate)}'`).join(' OR ')})`
    );
  }

  const exactParams = new URLSearchParams({
    where: whereParts.join(' AND '),
    outFields: 'HouseNum,Direction,StreetName,StreetAttr,CitationNum,CitationStatus,ViolationText,DateNotice,BlockLot',
    returnGeometry: 'false',
    f: 'json',
  });

  try {
    const features = await fetchArcGisQuery<Record<string, unknown>>(BALTIMORE_CODE_VIOLATIONS_URL, exactParams, headers);
    const cityAddress = toCityAddress(parsed) || address;

    const records = features
      .map((feature) => ({
        address: formatViolationAddress(feature.attributes),
        citationNumber: firstString(feature.attributes, ['CitationNum']),
        citationStatus: firstString(feature.attributes, ['CitationStatus']) || undefined,
        violationText: firstString(feature.attributes, ['ViolationText']),
        noticeDate: isoDate(feature.attributes.DateNotice),
        blockLot: firstString(feature.attributes, ['BlockLot']) || undefined,
      }))
      .filter((record) => record.address && record.citationNumber && isAddressMatch(record.address, cityAddress));

    if (records.length === 0) {
      setLookup(lookups, 'baltimore_code_violations', 'empty', 'Queried successfully; no code-enforcement citation records found for the address.');
      return {
        source,
        status: 'no_records_found' as const,
        note: 'Queried successfully; no code-enforcement citation records found for the address.',
        records: [],
      };
    }

    setLookup(lookups, 'baltimore_code_violations', 'success', `Queried successfully; ${records.length} code-enforcement citation record(s) returned.`);
    return {
      source,
      status: 'returned_data' as const,
      note: `Queried successfully; ${records.length} code-enforcement citation record(s) returned.`,
      records,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Code-violation lookup failed.';
    setLookup(lookups, 'baltimore_code_violations', 'unavailable', message);
    return {
      source,
      status: 'unavailable' as const,
      note: message,
      records: [],
    };
  }
}

function isOpenCitation(status: string | undefined) {
  const normalized = (status || '').trim().toUpperCase();
  if (!normalized) return true;
  return !['PAID', 'VOID', 'ABATE'].includes(normalized);
}

function buildDecision(report: Pick<ForensicReport, 'status' | 'subject' | 'datasets'>): ForensicDecision {
  if (report.status !== 'success' || !report.subject) {
    return {
      outcome: 'manual_review_required',
      summary: INSUFFICIENT_DATA_MESSAGE,
      rationale: ['The property did not resolve to a verified Maryland SDAT record.'],
      computedFrom: ['Maryland SDAT Property Dataset'],
      drivers: [],
    };
  }

  const datasetStatuses = [
    report.datasets.permits.status,
    report.datasets.codeViolations.status,
    report.datasets.vacantBuildingNotices.status,
  ];

  if (datasetStatuses.includes('unavailable')) {
    return {
      outcome: 'manual_review_required',
      summary: INSUFFICIENT_DATA_MESSAGE,
      rationale: ['One or more required Baltimore City sources were unavailable during this scan.'],
      computedFrom: [
        report.datasets.permits.source.label,
        report.datasets.codeViolations.source.label,
        report.datasets.vacantBuildingNotices.source.label,
      ],
      drivers: [],
    };
  }

  const openViolations = report.datasets.codeViolations.records.filter((record) => isOpenCitation(record.citationStatus));
  const vacantNotices = report.datasets.vacantBuildingNotices.records;

  if (openViolations.length > 0 || vacantNotices.length > 0) {
    const drivers: string[] = [];
    if (openViolations.length > 0) {
      drivers.push(`${openViolations.length} open or unresolved code-enforcement citation(s) on record`);
    }
    if (vacantNotices.length > 0) {
      drivers.push(`${vacantNotices.length} open vacant-building notice(s) on record`);
    }

    return {
      outcome: 'escalate',
      summary: 'Escalate. Baltimore City records show active distress or enforcement signals on this address.',
      rationale: [
        'The decision is driven by active Baltimore City enforcement or vacancy records, not by inferred scoring.',
      ],
      computedFrom: [
        report.datasets.codeViolations.source.label,
        report.datasets.vacantBuildingNotices.source.label,
      ],
      drivers,
    };
  }

  if (report.datasets.permits.status === 'no_records_found') {
    return {
      outcome: 'caution',
      summary: 'Caution. No permit history was returned from the current Baltimore City permit dataset for this address.',
      rationale: [
        'No active code-enforcement citations or open vacant-building notices were returned.',
        'The permit dataset query succeeded but did not return any permit records for the submitted address.',
      ],
      computedFrom: [
        report.datasets.permits.source.label,
        report.datasets.codeViolations.source.label,
        report.datasets.vacantBuildingNotices.source.label,
      ],
      drivers: ['No permit records found in the current Baltimore City permit dataset'],
    };
  }

  return {
    outcome: 'proceed',
    summary: 'Proceed. Queried city sources returned permit history and no active city-side distress signals for this address.',
    rationale: [
      'The permit dataset returned records for the address.',
      'No code-enforcement citations or open vacant-building notices were returned.',
    ],
    computedFrom: [
      report.datasets.permits.source.label,
      report.datasets.codeViolations.source.label,
      report.datasets.vacantBuildingNotices.source.label,
    ],
    drivers: ['Permit history on record', 'No active code-enforcement citations returned', 'No open vacant-building notices returned'],
  };
}

function makeErrorReport(address: string, mode: ForensicMode, refId: string, runAt: string, message: string): ForensicReport {
  const lookups = buildBaseLookups();
  return {
    status: 'error',
    mode,
    refId,
    runAt,
    queryAddress: address,
    subject: null,
    sources: {},
    datasets: {
      permits: emptyDataset({ label: 'Baltimore City Building Permits', url: BALTIMORE_BUILDING_PERMITS_LAYER_URL }),
      codeViolations: emptyDataset({ label: 'Baltimore City FTA Citation - $1,000', url: BALTIMORE_CODE_VIOLATIONS_LAYER_URL }),
      vacantBuildingNotices: emptyDataset({ label: 'Baltimore City Vacant Building Notice - Open', url: BALTIMORE_VACANT_BUILDINGS_LAYER_URL }),
    },
    queriedSources: lookups,
    decision: {
      outcome: 'manual_review_required',
      summary: INSUFFICIENT_DATA_MESSAGE,
      rationale: [message],
      computedFrom: [],
      drivers: [],
    },
    discrepancy: LEGACY_DISCREPANCY,
    lien: null,
    epa: null,
    logs: [`[ERROR] ${message}`],
  };
}

async function persistDealRecord(report: ForensicReport) {
  if (report.status !== 'success') return;

  try {
    await prisma.dealRecord.create({
      data: buildDealRecordData(report),
    });
  } catch (error) {
    console.error('DealRecord persistence failed:', error);
  }
}

export async function performForensicScan(address: string, mode: ForensicMode): Promise<ForensicReport> {
  const runAt = new Date().toISOString();
  const refId = toRefId();
  const searchAddress = normalizeAddress(address);

  if (!searchAddress) {
    return makeErrorReport(address, mode, refId, runAt, 'Missing address input.');
  }

  const token = process.env.SOCRATA_APP_TOKEN;
  const headers = token ? { 'X-App-Token': token } : undefined;
  const lookups = buildBaseLookups();

  try {
    const records = await fetchPropertyRecords(address, headers);

    if (!Array.isArray(records) || records.length === 0) {
      setLookup(lookups, 'maryland_property_dataset', 'empty', 'No records returned for the submitted Baltimore address.');
      const report: ForensicReport = {
        status: 'not_found',
        mode,
        refId,
        runAt,
        queryAddress: address,
        subject: null,
        sources: {},
        datasets: {
          permits: emptyDataset({ label: 'Baltimore City Building Permits', url: BALTIMORE_BUILDING_PERMITS_LAYER_URL }),
          codeViolations: emptyDataset({ label: 'Baltimore City FTA Citation - $1,000', url: BALTIMORE_CODE_VIOLATIONS_LAYER_URL }),
          vacantBuildingNotices: emptyDataset({ label: 'Baltimore City Vacant Building Notice - Open', url: BALTIMORE_VACANT_BUILDINGS_LAYER_URL }),
        },
        queriedSources: lookups,
        decision: {
          outcome: 'manual_review_required',
          summary: INSUFFICIENT_DATA_MESSAGE,
          rationale: ['The Maryland SDAT property dataset did not return a matching record for the submitted address.'],
          computedFrom: ['Maryland SDAT Property Dataset'],
          drivers: [],
        },
        discrepancy: LEGACY_DISCREPANCY,
        lien: null,
        epa: null,
        logs: ['[WARN] No records found from Maryland SDAT property dataset.'],
      };
      return report;
    }

    setLookup(lookups, 'maryland_property_dataset', 'success', `Maryland SDAT property dataset returned ${records.length} candidate record(s).`);
    const match = selectBestRecord(records, address);

    if (!match) {
      setLookup(lookups, 'maryland_property_dataset', 'empty', 'Candidate records were returned, but no exact address match was selected.');
      const report: ForensicReport = {
        status: 'not_found',
        mode,
        refId,
        runAt,
        queryAddress: address,
        subject: null,
        sources: {},
        datasets: {
          permits: emptyDataset({ label: 'Baltimore City Building Permits', url: BALTIMORE_BUILDING_PERMITS_LAYER_URL }),
          codeViolations: emptyDataset({ label: 'Baltimore City FTA Citation - $1,000', url: BALTIMORE_CODE_VIOLATIONS_LAYER_URL }),
          vacantBuildingNotices: emptyDataset({ label: 'Baltimore City Vacant Building Notice - Open', url: BALTIMORE_VACANT_BUILDINGS_LAYER_URL }),
        },
        queriedSources: lookups,
        decision: {
          outcome: 'manual_review_required',
          summary: INSUFFICIENT_DATA_MESSAGE,
          rationale: ['Candidate parcel records were returned, but the submitted address could not be matched cleanly.'],
          computedFrom: ['Maryland SDAT Property Dataset'],
          drivers: [],
        },
        discrepancy: LEGACY_DISCREPANCY,
        lien: null,
        epa: null,
        logs: ['[WARN] Property candidates returned but no exact address match was found.'],
      };
      return report;
    }

    const row = match as Record<string, unknown>;
    const propertyAddress =
      firstString(row, ['mdp_street_address_mdp_field_address']) || buildAddressFromPremiseFields(row) || address;
    const zoningCode = firstString(row, ['zoning_code_mdp_field_zoning_sdat_field_45']);
    const landUseCode = firstString(row, ['land_use_code_mdp_field_lu_desclu_sdat_field_50']);
    const assessedValueRaw = firstString(row, ['current_assessment_year_total_assessment_sdat_field_172']);
    const assessedValue = assessedValueRaw ? parseNumber(assessedValueRaw) : undefined;
    const { latitude, longitude } = extractCoordinates(row);

    const ownerResult = await fetchOwnerName(row, headers);
    setLookup(
      lookups,
      'maryland_sdat_owner',
      ownerResult.lookup.status,
      ownerResult.lookup.note,
      ownerResult.lookup.url
    );

    const permits = await queryPermits(propertyAddress, headers, lookups);
    const codeViolations = await queryCodeViolations(propertyAddress, headers, lookups);
    const vacantBuildingNotices = await queryVacantBuildingNotices(propertyAddress, headers, lookups);

    const report: ForensicReport = {
      status: 'success',
      mode,
      refId,
      runAt,
      queryAddress: address,
      subject: {
        address: propertyAddress,
        ...(ownerResult.owner ? { owner: ownerResult.owner } : {}),
        ...(zoningCode ? { zoning: zoningCode } : {}),
        ...(landUseCode ? { landUse: landUseCode } : {}),
        ...(typeof assessedValue === 'number'
          ? {
              assessmentValue: assessedValue,
              taxRecordLabel: `$${Math.round(assessedValue).toLocaleString()}`,
            }
          : {}),
        ...(latitude !== undefined ? { latitude } : {}),
        ...(longitude !== undefined ? { longitude } : {}),
      },
      sources: {
        address: {
          label: 'Maryland SDAT Property Dataset',
          url: MARYLAND_PROPERTY_DATASET_URL,
          detail: 'Field: mdp_street_address_mdp_field_address',
        },
        ...(ownerResult.owner
          ? {
              owner: {
                label: 'Maryland SDAT Property Detail',
                url: ownerResult.lookup.url,
                detail: 'Parsed from live SDAT property detail page',
              },
            }
          : {}),
        ...(zoningCode
          ? {
              zoning: {
                label: 'Maryland SDAT Property Dataset',
                url: MARYLAND_PROPERTY_DATASET_URL,
                detail: 'Field: zoning_code_mdp_field_zoning_sdat_field_45',
              },
            }
          : {}),
        ...(landUseCode
          ? {
              landUse: {
                label: 'Maryland SDAT Property Dataset',
                url: MARYLAND_PROPERTY_DATASET_URL,
                detail: 'Field: land_use_code_mdp_field_lu_desclu_sdat_field_50',
              },
            }
          : {}),
        ...(typeof assessedValue === 'number'
          ? {
              assessmentValue: {
                label: 'Maryland SDAT Property Dataset',
                url: MARYLAND_PROPERTY_DATASET_URL,
                detail: 'Field: current_assessment_year_total_assessment_sdat_field_172',
              },
            }
          : {}),
      },
      datasets: {
        permits,
        codeViolations,
        vacantBuildingNotices,
      },
      queriedSources: lookups,
      decision: {
        outcome: 'manual_review_required',
        summary: INSUFFICIENT_DATA_MESSAGE,
        rationale: [],
        computedFrom: [],
        drivers: [],
      },
      discrepancy: LEGACY_DISCREPANCY,
      lien: null,
      epa: null,
      logs: [
        '[START] Forensic scan initialized.',
        '[DATASET] Maryland SDAT property dataset queried via premise-address fields.',
        ownerResult.owner ? '[OWNER] Owner name verified from SDAT property detail.' : '[OWNER] Owner field omitted because SDAT did not return a parsable owner name.',
        `[LOOKUP] Baltimore permits ${permits.status}.`,
        `[LOOKUP] Baltimore code violations ${codeViolations.status}.`,
        `[LOOKUP] Baltimore vacant building notices ${vacantBuildingNotices.status}.`,
      ],
    };

    report.decision = buildDecision(report);
    await persistDealRecord(report);
    return report;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'System Error: Unable to verify record.';
    return makeErrorReport(address, mode, refId, runAt, message);
  }
}
