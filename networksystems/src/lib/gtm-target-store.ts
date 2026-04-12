import { prisma } from '@/lib/prisma';

export const GTM_STATUSES = ['NEW', 'CONTACTED', 'REPLIED', 'QUALIFIED', 'CLOSED_WON', 'CLOSED_LOST'] as const;
export type GtmStatus = (typeof GTM_STATUSES)[number];

export type GtmTargetStatusRecord = {
  targetId: string;
  status: GtmStatus;
  notes: string;
  updatedAt: string;
};

function keyFor(targetId: string): string {
  return `gtm_target_status::${targetId}`;
}

function parseValue(targetId: string, value: string | null, updatedAt: Date | null): GtmTargetStatusRecord {
  if (!value) {
    return {
      targetId,
      status: 'NEW',
      notes: '',
      updatedAt: updatedAt ? updatedAt.toISOString() : new Date(0).toISOString(),
    };
  }

  try {
    const parsed = JSON.parse(value) as Partial<GtmTargetStatusRecord>;
    const status = GTM_STATUSES.includes((parsed.status || '') as GtmStatus) ? (parsed.status as GtmStatus) : 'NEW';
    return {
      targetId,
      status,
      notes: parsed.notes || '',
      updatedAt: updatedAt ? updatedAt.toISOString() : new Date().toISOString(),
    };
  } catch {
    return {
      targetId,
      status: 'NEW',
      notes: '',
      updatedAt: updatedAt ? updatedAt.toISOString() : new Date(0).toISOString(),
    };
  }
}

export async function getGtmTargetStatuses(targetIds: string[]): Promise<Record<string, GtmTargetStatusRecord>> {
  if (targetIds.length === 0) return {};
  const keys = targetIds.map(keyFor);
  const rows = await (prisma as any).systemConfig.findMany({
    where: { key: { in: keys } },
  });
  const byKey = new Map<string, { value: string; updatedAt: Date }>(
    rows.map((row: { key: string; value: string; updatedAt: Date }) => [row.key, { value: row.value, updatedAt: row.updatedAt }])
  );

  const out: Record<string, GtmTargetStatusRecord> = {};
  for (const targetId of targetIds) {
    const key = keyFor(targetId);
    const row = byKey.get(key);
    out[targetId] = parseValue(targetId, row?.value || null, row?.updatedAt || null);
  }
  return out;
}

export async function upsertGtmTargetStatus(params: {
  targetId: string;
  status: GtmStatus;
  notes?: string;
}): Promise<GtmTargetStatusRecord> {
  const payload = JSON.stringify({
    targetId: params.targetId,
    status: params.status,
    notes: params.notes || '',
  });

  const row = await (prisma as any).systemConfig.upsert({
    where: { key: keyFor(params.targetId) },
    update: {
      value: payload,
      category: 'gtm',
      dataType: 'json',
    },
    create: {
      key: keyFor(params.targetId),
      value: payload,
      category: 'gtm',
      dataType: 'json',
    },
  });

  return parseValue(params.targetId, row.value, row.updatedAt);
}
