'use server';

export type ComplianceCheckResult =
  | {
      status: 'record_found';
      query: { name: string; zip: string };
      record: {
        facName: string;
        registryId: string;
        city?: string;
        state?: string;
        zip?: string;
        cwpStatus?: string;
        rcraStatus?: string;
      };
      confidence: number;
      note: string;
    }
  | {
      status: 'no_record_found';
      query: { name: string; zip: string };
      record: null;
      confidence: number;
      note: string;
    }
  | {
      status: 'error';
      query: { name: string; zip: string };
      record: null;
      confidence: number;
      note: string;
    };

function normalize(input: string) {
  return input
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function tokens(s: string) {
  return new Set(
    normalize(s)
      .split(/\s+/)
      .filter(Boolean)
      .filter((t) => t.length > 1)
  );
}

function scoreMatch(query: string, candidate: string) {
  const a = tokens(query);
  const b = tokens(candidate);
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const t of a) if (b.has(t)) hit += 1;
  return hit / Math.max(a.size, 1);
}

function firstString(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
}

async function fetchJson(url: string) {
  const res = await fetch(url, { method: 'GET', cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Fetch failed (${res.status}) ${body.slice(0, 120)}`);
  }
  return res.json();
}

export async function checkCompliance(name: string, zip: string): Promise<ComplianceCheckResult> {
  const n = normalize(name);
  const z = zip.trim();

  if (!n || !z) {
    return {
      status: 'error',
      query: { name, zip },
      record: null,
      confidence: 0,
      note: 'Missing practice name or zip code.',
    };
  }

  try {
    const params = new URLSearchParams({
      output: 'JSON',
      p_st: 'MD',
      p_zip: z,
      p_fa: name,
      // Keep result set bounded.
      p_pt: 'AUTO', // broad program bucket; harmless if ignored
    });

    const url = `https://echodata.epa.gov/echo/echo_rest_services.get_facility_info?${params.toString()}`;
    const json = await fetchJson(url);
    const results = (json?.Results ?? json?.results ?? json) as any;
    const rows = Array.isArray(results?.Facilities) ? results.Facilities : Array.isArray(results) ? results : [];

    if (!rows.length) {
      return {
        status: 'no_record_found',
        query: { name, zip: z },
        record: null,
        confidence: 0,
        note:
          'No matching EPA ECHO facility record returned for this name+zip query. This is not proof of non-compliance; it indicates the record may be absent or indexed differently.',
      };
    }

    const best = rows
      .map((r: any) => {
        const facName = firstString(r, ['FacName', 'FAC_NAME', 'FacilityName']);
        return { r, facName, s: scoreMatch(n, facName) };
      })
      .sort((a: { s: number }, b: { s: number }) => b.s - a.s)[0];

    if (!best || best.s < 0.2) {
      return {
        status: 'no_record_found',
        query: { name, zip: z },
        record: null,
        confidence: best?.s ?? 0,
        note:
          'Facilities were returned for this zip, but none matched the practice name with sufficient confidence. Try a shorter name or check spelling.',
      };
    }

    const r = best.r;
    const facName = best.facName || firstString(r, ['FacName', 'FAC_NAME', 'FacilityName']) || name;
    const registryId = firstString(r, ['RegistryID', 'REGISTRY_ID', 'FRSID', 'FRS_ID']) || 'UNKNOWN';
    const city = firstString(r, ['FacCity', 'FAC_CITY', 'City']);
    const state = firstString(r, ['FacState', 'FAC_STATE', 'State']);
    const cwpStatus = firstString(r, ['CWPStatus', 'CWP_STATUS']);
    const rcraStatus = firstString(r, ['RCRAStatus', 'RCRA_STATUS']);

    return {
      status: 'record_found',
      query: { name, zip: z },
      record: { facName, registryId, city: city || undefined, state: state || undefined, zip: z, cwpStatus: cwpStatus || undefined, rcraStatus: rcraStatus || undefined },
      confidence: best.s,
      note:
        'EPA ECHO record found for this query. Use this as a starting point; always verify manifests and program applicability with the practice.',
    };
  } catch (error: any) {
    return {
      status: 'error',
      query: { name, zip: z },
      record: null,
      confidence: 0,
      note: `Manual verification required: ${error?.message ?? 'Unknown error'}`,
    };
  }
}
