'use server';

import { GTM_STATUSES, getGtmTargetStatuses, type GtmStatus, upsertGtmTargetStatus } from '@/lib/gtm-target-store';

export async function getGtmTargetStatusesAction(targetIds: string[]) {
  return getGtmTargetStatuses(targetIds);
}

export async function updateGtmTargetStatusAction(params: {
  targetId: string;
  status: GtmStatus;
  notes?: string;
}) {
  if (!GTM_STATUSES.includes(params.status)) {
    throw new Error('Invalid GTM status.');
  }
  return upsertGtmTargetStatus(params);
}
