export type ServiceRequestRecord = {
  address: string;
  openedAt: string;
  status: string;
  category?: string;
  serviceRequestId?: string;
};

export type PermitRecord = {
  address: string;
  permitDate: string;
  permitType: string;
  status?: string;
  description?: string;
};

export type InstitutionalLeak = {
  address: string;
  permitType: string;
  daysOpen: number;
  riskProfile: string;
};

export type RealPropertyRecord = {
  address: string;
  ownerName?: string;
  lastSalePrice?: number;
  lastSaleDate?: string;
};

export type HighBleedVendor = {
  vendorName: string;
  totalPayments: number;
  penaltyTotal: number;
  spendCategory: string;
};

export const SOCRATA_311_DATASET = '9agw-sxsr';
export const DHCD_PERMITS_LAYER =
  'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/FeatureServer/3';
export const DHCD_FORECLOSURE_LAYER =
  'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/FeatureServer/11';
export const DHCD_REAL_PROPERTY_LAYER =
  'https://egisdata.baltimorecity.gov/egis/rest/services/Housing/DHCD_Open_Baltimore_Datasets/FeatureServer/12';
export const OPEN_CHECKBOOK_FY22_LAYER =
  'https://services1.arcgis.com/UWYHeuuJISiGmgXx/ArcGIS/rest/services/OpenCheckbookFY2022_Through_Present/FeatureServer/1';

export const normalizeAddress = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

export async function fetchSocrataDataset<T>(
  datasetId: string,
  params: Record<string, string | number | boolean>
): Promise<T[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
  const response = await fetch(`https://data.baltimorecity.gov/resource/${datasetId}.json?${query.toString()}`, {
    headers: process.env.NEXT_PUBLIC_SOCRATA_TOKEN
      ? { 'X-App-Token': process.env.NEXT_PUBLIC_SOCRATA_TOKEN }
      : undefined,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch Socrata dataset ${datasetId}`);
  }
  return response.json();
}

export async function fetchArcGisLayer<T>(
  layerUrl: string,
  params: Record<string, string | number | boolean>
): Promise<T[]> {
  const query = new URLSearchParams({ f: 'json', ...Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  ) });
  const response = await fetch(`${layerUrl}?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ArcGIS layer ${layerUrl}`);
  }
  const data = await response.json();
  return (data.features || []).map((feature: { attributes: T }) => feature.attributes);
}

export async function fetchHighBleedVendors(limit: number = 500) {
  const vendors = ['Veolia', 'WinWaste', 'Clean Harbors'];
  const spendKeywords = ['late', 'interest', 'penalty'];

  const whereVendor = vendors.map((vendor) => `SUPPLIER_NAME LIKE '%${vendor}%'`).join(' OR ');
  const whereSpend = spendKeywords
    .map((keyword) => `SPEND_CATEGORY_DESCRIPTION LIKE '%${keyword.toUpperCase()}%'`)
    .join(' OR ');

  const results = await fetchArcGisLayer<Record<string, string | number>>(
    OPEN_CHECKBOOK_FY22_LAYER,
    {
      where: `(${whereVendor}) AND (${whereSpend})`,
      outFields: '*',
      resultRecordCount: limit,
    }
  );

  const rollup = new Map<string, HighBleedVendor>();
  results.forEach((row) => {
    const vendorName = String(row.SUPPLIER_NAME || row.supplier_name || 'Unknown Vendor');
    const spendCategory = String(row.SPEND_CATEGORY_DESCRIPTION || row.spend_category_description || '');
    const paymentAmount = Number(row.PAYMENT_AMOUNT_SPLIT || row.payment_amount_split || row.AMOUNT || 0);
    const penaltyAmount = Number(row.LATE_FEE_AMOUNT || row.late_fee_amount || row.INTEREST_AMOUNT || row.interest_amount || 0);

    const key = `${vendorName}-${spendCategory}`;
    const current = rollup.get(key) || {
      vendorName,
      spendCategory,
      totalPayments: 0,
      penaltyTotal: 0,
    };
    current.totalPayments += Number.isFinite(paymentAmount) ? paymentAmount : 0;
    current.penaltyTotal += Number.isFinite(penaltyAmount) ? penaltyAmount : 0;
    rollup.set(key, current);
  });

  return Array.from(rollup.values())
    .sort((a, b) => b.penaltyTotal - a.penaltyTotal)
    .slice(0, 3);
}

export async function fetch311WaterRequests(limit: number = 200, zipFilter: string[] = []) {
  const zipClause = zipFilter.length
    ? ` AND (zip_code in('${zipFilter.join("','")}') OR zipcode in('${zipFilter.join("','")}') OR zip in('${zipFilter.join("','")}'))`
    : '';
  const results = await fetchSocrataDataset<Record<string, string | number>>(SOCRATA_311_DATASET, {
    $limit: limit,
    $order: 'created_date DESC',
    $where: `(category like 'Water%' OR category like 'Sewer%')${zipClause}`,
  });

  return results.map((row) => ({
    address: String(row.address || row.address_1 || row.street_address || ''),
    openedAt: String(row.created_date || row.created || ''),
    status: String(row.status || '').toLowerCase() || 'open',
    category: String(row.category || ''),
    serviceRequestId: String(row.service_request_id || row.sr_id || row.case_number || ''),
  })) as ServiceRequestRecord[];
}

export async function fetchPermits(limit: number = 200, zipFilter: string[] = []) {
  const zipClause = zipFilter.length
    ? ` AND (ZIPCODE in('${zipFilter.join("','")}') OR ZIP_CODE in('${zipFilter.join("','")}') OR ZIP in('${zipFilter.join("','")}'))`
    : '';
  const results = await fetchArcGisLayer<Record<string, string | number>>(DHCD_PERMITS_LAYER, {
    where: `1=1${zipClause}`,
    outFields: '*',
    resultRecordCount: limit,
    orderByFields: 'permit_date DESC',
  });

  return results.map((row) => ({
    address: String(row.address || row.location || ''),
    permitDate: String(row.permit_date || row.issue_date || ''),
    permitType: String(row.permit_type || row.permitcategory || row.permit || ''),
    description: String(row.description || row.work_description || ''),
    status: String(row.status || ''),
  })) as PermitRecord[];
}

export async function fetchForeclosureFilings(limit: number = 200, zipFilter: string[] = []) {
  const zipClause = zipFilter.length
    ? ` AND (ZIPCODE in('${zipFilter.join("','")}') OR ZIP_CODE in('${zipFilter.join("','")}') OR ZIP in('${zipFilter.join("','")}'))`
    : '';
  return fetchArcGisLayer<Record<string, string | number>>(DHCD_FORECLOSURE_LAYER, {
    where: `1=1${zipClause}`,
    outFields: '*',
    resultRecordCount: limit,
    orderByFields: 'filedate DESC',
  });
}

export async function fetchRealPropertyByAddress(address: string) {
  const normalized = normalizeAddress(address);
  if (!normalized) return null;
  const where = `UPPER(REPLACE(REPLACE(address,'-',' '),',','')) like '%${normalized}%'`;
  const results = await fetchArcGisLayer<Record<string, string | number>>(DHCD_REAL_PROPERTY_LAYER, {
    where,
    outFields: '*',
    resultRecordCount: 1,
  });

  const record = results[0];
  if (!record) return null;
  return {
    address: String(record.address || ''),
    ownerName: String(record.ownername || record.owner_name || ''),
    lastSalePrice: Number(record.saleprice || record.last_sale_price || 0),
    lastSaleDate: String(record.saledate || record.last_sale_date || ''),
  } as RealPropertyRecord;
}

export function hasEnvironmentalRisk(permit: PermitRecord) {
  const combined = `${permit.permitType} ${permit.description}`.toLowerCase();
  return ['dental', 'medical', 'clinic', 'laboratory', 'lab'].some((keyword) => combined.includes(keyword));
}

export function isWaterRequest(request: ServiceRequestRecord) {
  return (request.category || '').toLowerCase().includes('water') || (request.category || '').toLowerCase().includes('sewer');
}

export function detectInstitutionalLeak(
  permits: PermitRecord[],
  serviceRequests: ServiceRequestRecord[],
  now: Date = new Date()
): InstitutionalLeak[] {
  const openRequests = serviceRequests
    .filter((request) => request.status.toLowerCase() === 'open')
    .map((request) => ({
      ...request,
      normalized: normalizeAddress(request.address),
      openedAtDate: new Date(request.openedAt),
    }))
    .filter((request) => {
      const diffDays = (now.getTime() - request.openedAtDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 30;
    });

  return permits.flatMap((permit) => {
    const permitDate = new Date(permit.permitDate);
    if (Number.isNaN(permitDate.getTime())) return [];
    const normalized = normalizeAddress(permit.address);
    const match = openRequests.find((request) => request.normalized === normalized);
    if (!match) return [];
    const daysOpen = Math.floor((now.getTime() - match.openedAtDate.getTime()) / (1000 * 60 * 60 * 24));
    return [{
      address: permit.address,
      permitType: permit.permitType,
      daysOpen,
      riskProfile: 'Operational Deadlock',
    }];
  });
}
