import { resilientFetch, type DataTierStatus } from '@/lib/api/resilient-fetch';

export type DataSourceState = 'connected' | 'disconnected';

export type DataSourceStatus = {
  state: DataSourceState;
  tier: 0 | 1 | 2 | 3;
  provider: DataTierStatus | 'NONE';
  source: string;
  message: string;
  checkedAt: string;
};

const CITY_API_URL = 'https://data.baltimorecity.gov/resource/6bx4-iirp.json';
const STATE_API_URL = 'https://opendata.maryland.gov/resource/6bx4-iirp.json';
const FEDERAL_API_URL = 'https://hudgis-hud.opendata.arcgis.com/datasets/6bx4-iirp_subset.json';

export async function getDataSourceStatus(): Promise<DataSourceStatus> {
  const checkedAt = new Date().toISOString();
  const token = process.env.SOCRATA_APP_TOKEN;

  try {
    const cityParams = new URLSearchParams({
      q: '21201',
      $limit: '1',
    });
    const stateParams = new URLSearchParams({
      county_name_mdp_field_cntyname: 'BALTIMORE CITY',
      q: '21201',
      $limit: '1',
    });
    const federalParams = new URLSearchParams({
      q: '21201',
    });

    const endpoints = [
      `${CITY_API_URL}?${cityParams.toString()}`,
      `${STATE_API_URL}?${stateParams.toString()}`,
      `${FEDERAL_API_URL}?${federalParams.toString()}`,
    ];

    const probe = await resilientFetch<Record<string, unknown>[]>(
      endpoints,
      (raw) => {
        if (Array.isArray(raw)) return raw as Record<string, unknown>[];
        if (raw && typeof raw === 'object' && Array.isArray((raw as { features?: unknown[] }).features)) {
          return ((raw as { features: Record<string, unknown>[] }).features ?? []).map(
            (f) => ((f as { attributes?: Record<string, unknown> }).attributes ?? {}) as Record<string, unknown>
          );
        }
        return [];
      },
      {
        headers: token ? { 'X-App-Token': token } : undefined,
        timeoutMs: 5000,
      }
    );

    const sourceByTier: Record<number, string> = {
      1: 'Baltimore City Portal',
      2: 'Maryland State Portal',
      3: 'Federal HUD Mirror',
    };

    const messageByProvider: Record<DataTierStatus, string> = {
      CITY: 'Connected to City primary source.',
      STATE: 'City unavailable, running on State failover.',
      FEDERAL: 'City/State unavailable, running on Federal failover.',
    };

    return {
      state: 'connected',
      tier: probe.tier,
      provider: probe.status,
      source: sourceByTier[probe.tier] ?? 'Unknown Source',
      message: messageByProvider[probe.status],
      checkedAt,
    };
  } catch {
    return {
      state: 'disconnected',
      tier: 0,
      provider: 'NONE',
      source: 'All Tiers',
      message: 'Unable to reach City, State, and Federal sources.',
      checkedAt,
    };
  }
}
