import type { ProcurementRecord } from '@/lib/api/procurement-ingest';

export type VendorEntity = {
  id: string;
  canonicalName: string;
  aliases: string[];
};

export type ResolvedProcurementRecord = ProcurementRecord & {
  vendorEntityId: string;
  canonicalVendorName: string;
};

const LEGAL_SUFFIX_RE = /\b(incorporated|inc|llc|l\.l\.c\.|co|corp|corporation|ltd|limited|pllc|lp)\b/g;
const NON_ALNUM_RE = /[^a-z0-9\s]/g;
const SPACE_RE = /\s+/g;

const KNOWN_VENDOR_ENTITIES: VendorEntity[] = [
  {
    id: 'VEND-MDH-LABGENOMICS',
    canonicalName: 'LabGenomics',
    aliases: ['labgenomics', 'lab genomics', 'labgenomics historical'],
  },
  {
    id: 'VEND-BYTEGRID',
    canonicalName: 'ByteGrid',
    aliases: ['bytegrid', 'bytegrid llc'],
  },
  {
    id: 'VEND-HARRINGTON',
    canonicalName: 'R.E. Harrington Plumbing',
    aliases: ['re harrington plumbing', 'r e harrington plumbing', 'harrington plumbing'],
  },
  {
    id: 'VEND-MONUMENTAL',
    canonicalName: 'Monumental Paving',
    aliases: ['monumental paving', 'monumental paving llc'],
  },
];

export function normalizeVendorName(name: string): string {
  return name
    .toLowerCase()
    .replace(LEGAL_SUFFIX_RE, '')
    .replace(NON_ALNUM_RE, ' ')
    .replace(SPACE_RE, ' ')
    .trim();
}

function aliasDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.includes(b) || b.includes(a)) return 1;
  const aTokens = new Set(a.split(' '));
  const bTokens = new Set(b.split(' '));
  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }
  const union = aTokens.size + bTokens.size - overlap;
  const jaccard = union === 0 ? 0 : overlap / union;
  return jaccard >= 0.75 ? 2 : 999;
}

function matchKnownEntity(normalizedVendor: string): VendorEntity | null {
  let best: { entity: VendorEntity; score: number } | null = null;

  for (const entity of KNOWN_VENDOR_ENTITIES) {
    for (const alias of entity.aliases) {
      const normalizedAlias = normalizeVendorName(alias);
      const score = aliasDistance(normalizedVendor, normalizedAlias);
      if (score >= 999) continue;
      if (!best || score < best.score) {
        best = { entity, score };
      }
    }
  }

  return best?.entity || null;
}

export function resolveVendorEntityName(vendorName: string): { vendorEntityId: string; canonicalVendorName: string } {
  const normalized = normalizeVendorName(vendorName);
  const known = matchKnownEntity(normalized);

  if (known) {
    return {
      vendorEntityId: known.id,
      canonicalVendorName: known.canonicalName,
    };
  }

  const generatedId = `VEND-${normalized.replace(/\s+/g, '-').toUpperCase().slice(0, 40)}`;
  return {
    vendorEntityId: generatedId,
    canonicalVendorName: vendorName,
  };
}

export function resolveProcurementVendors(records: ProcurementRecord[]): {
  records: ResolvedProcurementRecord[];
  entities: VendorEntity[];
} {
  const dynamicEntities = new Map<string, VendorEntity>();

  const resolvedRecords: ResolvedProcurementRecord[] = records.map((record) => {
    const resolved = resolveVendorEntityName(record.vendor);

    if (!KNOWN_VENDOR_ENTITIES.some((entity) => entity.id === resolved.vendorEntityId)) {
      const existing = dynamicEntities.get(resolved.vendorEntityId);
      if (!existing) {
        dynamicEntities.set(resolved.vendorEntityId, {
          id: resolved.vendorEntityId,
          canonicalName: resolved.canonicalVendorName,
          aliases: [normalizeVendorName(record.vendor)],
        });
      } else {
        const alias = normalizeVendorName(record.vendor);
        if (!existing.aliases.includes(alias)) existing.aliases.push(alias);
      }
    }

    return {
      ...record,
      vendorEntityId: resolved.vendorEntityId,
      canonicalVendorName: resolved.canonicalVendorName,
    };
  });

  return {
    records: resolvedRecords,
    entities: [...KNOWN_VENDOR_ENTITIES, ...dynamicEntities.values()],
  };
}
