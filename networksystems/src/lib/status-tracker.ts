import { prisma } from '@/lib/prisma';
import type { OutreachStatus, TargetStatus } from '@prisma/client';

export const OUTREACH_STATUSES: OutreachStatus[] = [
  'NEW',
  'PACKET_GENERATED',
  'MAILED',
  'FOLLOW_UP',
  'CLOSED',
];

export type TargetStatusRecord = {
  address: string;
  zipCode: string;
  status: OutreachStatus;
  notes: string | null;
  packetGeneratedAt: string | null;
  mailedAt: string | null;
  updatedAt: string;
};

function normalizeAddress(address: string) {
  return address
    .toUpperCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toRecord(row: TargetStatus): TargetStatusRecord {
  return {
    address: row.address,
    zipCode: row.zipCode,
    status: row.status,
    notes: row.notes,
    packetGeneratedAt: row.packetGeneratedAt ? row.packetGeneratedAt.toISOString() : null,
    mailedAt: row.mailedAt ? row.mailedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function upsertTargetStatus({
  address,
  zipCode,
  status,
  notes,
}: {
  address: string;
  zipCode: string;
  status: OutreachStatus;
  notes?: string;
}): Promise<TargetStatusRecord> {
  const normalizedAddress = normalizeAddress(address);
  const cleanZip = (zipCode || '').trim();

  const row = await prisma.targetStatus.upsert({
    where: {
      target_status_unique: {
        normalizedAddress,
        zipCode: cleanZip,
      },
    },
    update: {
      address,
      status,
      notes: notes ?? undefined,
      packetGeneratedAt: status === 'PACKET_GENERATED' ? new Date() : undefined,
      mailedAt: status === 'MAILED' ? new Date() : undefined,
    },
    create: {
      address,
      normalizedAddress,
      zipCode: cleanZip,
      status,
      notes: notes ?? null,
      packetGeneratedAt: status === 'PACKET_GENERATED' ? new Date() : null,
      mailedAt: status === 'MAILED' ? new Date() : null,
    },
  });

  return toRecord(row);
}

export async function getTargetStatuses({
  addresses,
  zipCode,
}: {
  addresses: string[];
  zipCode?: string;
}): Promise<Record<string, TargetStatusRecord>> {
  const normalizedAddresses = addresses.map(normalizeAddress);
  const cleanZip = (zipCode || '').trim();

  if (normalizedAddresses.length === 0) return {};

  const rows = await prisma.targetStatus.findMany({
    where: {
      normalizedAddress: { in: normalizedAddresses },
      ...(cleanZip ? { zipCode: cleanZip } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  });

  const out: Record<string, TargetStatusRecord> = {};
  for (const row of rows) {
    const key = normalizeAddress(row.address);
    if (!out[key]) out[key] = toRecord(row);
  }

  return out;
}

export async function exportStatusCsv(zipCode?: string): Promise<string> {
  const cleanZip = (zipCode || '').trim();
  const rows = await prisma.targetStatus.findMany({
    where: cleanZip ? { zipCode: cleanZip } : undefined,
    orderBy: [{ updatedAt: 'desc' }],
  });

  const header = [
    'address',
    'zip_code',
    'status',
    'notes',
    'packet_generated_at',
    'mailed_at',
    'updated_at',
  ];

  const lines = rows.map((row) => {
    const fields = [
      row.address,
      row.zipCode,
      row.status,
      row.notes || '',
      row.packetGeneratedAt ? row.packetGeneratedAt.toISOString() : '',
      row.mailedAt ? row.mailedAt.toISOString() : '',
      row.updatedAt.toISOString(),
    ];

    return fields
      .map((field) => {
        const v = String(field);
        if (v.includes(',') || v.includes('"') || v.includes('\n')) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return v;
      })
      .join(',');
  });

  return [header.join(','), ...lines].join('\n');
}
