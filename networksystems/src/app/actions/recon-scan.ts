'use server';

import { scanSector as scanSectorCore, type ReconTarget } from '@/lib/api/recon-scan';

export async function scanSector(zipCode: string): Promise<ReconTarget[]> {
  return scanSectorCore(zipCode);
}

