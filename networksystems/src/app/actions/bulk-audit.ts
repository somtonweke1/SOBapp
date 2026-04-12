'use server';

import { generateBulkPackets, type BulkAuditResult } from '@/lib/api/bulk-audit';

export async function generateBulkPacketsAction(addresses: string[]): Promise<BulkAuditResult> {
  return generateBulkPackets(addresses);
}
