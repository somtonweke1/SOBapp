'use server';

import type { OutreachStatus } from '@prisma/client';
import {
  exportStatusCsv,
  getTargetStatuses,
  OUTREACH_STATUSES,
  upsertTargetStatus,
} from '@/lib/status-tracker';

export async function getTargetStatusesAction(addresses: string[], zipCode?: string) {
  return getTargetStatuses({ addresses, zipCode });
}

export async function updateTargetStatusAction(params: {
  address: string;
  zipCode: string;
  status: OutreachStatus;
  notes?: string;
}) {
  if (!OUTREACH_STATUSES.includes(params.status)) {
    throw new Error('Invalid outreach status.');
  }
  return upsertTargetStatus(params);
}

export async function exportTargetStatusCsvAction(zipCode?: string) {
  return exportStatusCsv(zipCode);
}

export async function markPacketGeneratedBatchAction(addresses: string[], zipCode: string) {
  await Promise.all(
    addresses.map((address) =>
      upsertTargetStatus({
        address,
        zipCode,
        status: 'PACKET_GENERATED',
      })
    )
  );
}
