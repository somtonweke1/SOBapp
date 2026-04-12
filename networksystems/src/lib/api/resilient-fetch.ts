export type DataTierStatus = 'CITY' | 'STATE' | 'FEDERAL';

export type ResilientFetchResult<T> = {
  data: T;
  tier: 1 | 2 | 3;
  status: DataTierStatus;
};

type Mapper<T> = (data: unknown) => T;

function timeoutSignal(ms: number) {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return (AbortSignal as typeof AbortSignal & { timeout: (ms: number) => AbortSignal }).timeout(ms);
  }
  return undefined;
}

export async function resilientFetch<T>(
  endpoints: string[],
  mapper: Mapper<T>,
  options?: {
    headers?: Record<string, string>;
    timeoutMs?: number;
  }
): Promise<ResilientFetchResult<T>> {
  const statuses: DataTierStatus[] = ['CITY', 'STATE', 'FEDERAL'];
  const timeoutMs = options?.timeoutMs ?? 5000;

  for (let i = 0; i < endpoints.length; i += 1) {
    const endpoint = endpoints[i];
    const tier = (i + 1) as 1 | 2 | 3;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(options?.headers ?? {}),
        },
        cache: 'no-store',
        signal: timeoutSignal(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Tier ${tier} HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        throw new Error(`Tier ${tier} non-JSON response`);
      }

      const payload = await response.json();
      const mapped = mapper(payload);

      if (Array.isArray(mapped) && mapped.length === 0) {
        throw new Error(`Tier ${tier} empty payload`);
      }

      return {
        data: mapped,
        tier,
        status: statuses[i] ?? 'FEDERAL',
      };
    } catch (error) {
      const nextTier = i + 2;
      console.warn(
        `Fallback: Tier ${tier} failed${nextTier <= endpoints.length ? `, trying Tier ${nextTier}` : ''}.`,
        error
      );
    }
  }

  throw new Error('Critical Failure: All Data Tiers Offline.');
}
