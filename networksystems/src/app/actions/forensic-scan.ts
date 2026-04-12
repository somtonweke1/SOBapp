'use server';

import {
  performForensicScan as performForensicScanCore,
  type ForensicMode,
  type ForensicReport,
} from '@/lib/api/forensic-scan';

export async function performForensicScan(address: string, mode: ForensicMode): Promise<ForensicReport> {
  return performForensicScanCore(address, mode);
}
