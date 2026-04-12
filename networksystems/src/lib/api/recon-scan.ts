import { resilientFetch, type DataTierStatus } from '@/lib/api/resilient-fetch';

export type ReconTarget = {
  address: string;
  owner: string;
  landUse: string;
  assessedValue: number;
  assessedValueLabel: string;
  high_mismatch_prob: true;
  isOfflineResult?: boolean;
};

export type ReconScanResult = {
  targets: ReconTarget[];
  tier: 1 | 2 | 3;
  status: DataTierStatus;
};

const CITY_API_URL = 'https://data.baltimorecity.gov/resource/6bx4-iirp.json';
const STATE_API_URL = 'https://opendata.maryland.gov/resource/6bx4-iirp.json';
const FEDERAL_API_URL = 'https://hudgis-hud.opendata.arcgis.com/datasets/6bx4-iirp_subset.json';

function asString(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function toNumber(value: unknown) {
  const n = Number(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function toMoney(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

export async function scanSector(zipCode: string): Promise<ReconTarget[]> {
  const cleanZip = zipCode.trim().slice(0, 5);
  if (!/^\d{5}$/.test(cleanZip)) return [];

  const token = process.env.SOCRATA_APP_TOKEN;

  try {
    const cityParams = new URLSearchParams({
      q: cleanZip,
      $limit: '20',
    });
    const stateParams = new URLSearchParams({
      county_name_mdp_field_cntyname: 'BALTIMORE CITY',
      q: cleanZip,
      $limit: '20',
    });
    const federalParams = new URLSearchParams({
      q: cleanZip,
    });

    const endpoints = [
      `${CITY_API_URL}?${cityParams.toString()}`,
      `${STATE_API_URL}?${stateParams.toString()}`,
      `${FEDERAL_API_URL}?${federalParams.toString()}`,
    ];

    const { data, status, tier } = await resilientFetch<ReconTarget[]>(
      endpoints,
      (raw) => {
        const records = Array.isArray(raw)
          ? (raw as Record<string, unknown>[])
          : Array.isArray((raw as { features?: unknown[] }).features)
            ? ((raw as { features: Record<string, unknown>[] }).features ?? []).map((f) =>
                ((f as { attributes?: Record<string, unknown> }).attributes ?? {}) as Record<string, unknown>
              )
            : [];

        return records.map((record: Record<string, unknown>) => {
          const assessedValue = toNumber(
            record.total_assessment_mdp_field_tot_assmt ??
              record.bldg_assess_value ??
              record.total_assessment ??
              record.assessment ??
              record.assessed_value
          );

          return {
            address:
              asString(record.address) ||
              asString(record.address_mdp_field_address) ||
              asString(record.propertyaddress) ||
              asString(record.location_1_address) ||
              asString(record.property_address) ||
              'Unknown',
            owner:
              asString(record.owner_1) ||
              asString(record.owner_name_mdp_field_ownname) ||
              asString(record.owner_name) ||
              asString(record.ownername) ||
              'Unknown',
            landUse:
              asString(record.landUseCode) ||
              asString(record.land_use_code_mdp_field_lu) ||
              asString(record.landusecode) ||
              asString(record.zoning) ||
              'C-1',
            assessedValue,
            assessedValueLabel: toMoney(assessedValue),
            high_mismatch_prob: true as const,
          };
        });
      },
      {
        headers: token ? { 'X-App-Token': token } : undefined,
        timeoutMs: 5000,
      }
    );

    console.log('RECON DATA INBOUND:', { tier, status, count: data.length });

    return data;
  } catch (error) {
    console.error('Recon Scan Failed:', error);
    return [];
  }
}
