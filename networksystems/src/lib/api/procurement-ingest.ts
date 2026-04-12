export type ProcurementMethod =
  | 'Emergency'
  | 'Sole Source'
  | 'Competitive'
  | 'Expedited'
  | 'Small Procurement'
  | 'Unknown';

export type SourceEvidence = {
  page: number;
  excerpt: string;
};

export type ProcurementRecord = {
  id: string;
  agency: string;
  vendor: string;
  amount: number;
  method: ProcurementMethod;
  category?: string;
  startDate: string;
  currentEndDate: string;
  jurisdiction: 'Maryland State' | 'Baltimore City';
  sourceUrl: string;
  vendorAddress?: string;
  vendorPhone?: string;
  waiverGranted?: boolean;
  boardActionDate?: string;
  sourceEvidence?: SourceEvidence[];
  vendorEntityId?: string;
  canonicalVendorName?: string;
  activityType?: 'contract' | 'award' | 'low_bidder' | 'solicitation';
  sourceLabel?: string;
  sourceSystem?: string;
};

export async function ingestProcurementData(): Promise<ProcurementRecord[]> {
  let liveRecords: ProcurementRecord[] = [];
  try {
    const { fetchLiveProcurementRecords } = await import('@/lib/api/procurement-live');
    const { materializeOntologyFromRecords, readProcurementFromOntology } = await import('@/lib/risk/ontology-store');
    liveRecords = await fetchLiveProcurementRecords();
    if (liveRecords.length > 0) {
      await materializeOntologyFromRecords(liveRecords);
    }
    const fromDb = await readProcurementFromOntology();
    if (fromDb.length > 0) return fromDb;
    if (liveRecords.length > 0) return liveRecords;
  } catch {
    // Return direct live records if DB materialization/read fails.
    if (liveRecords.length > 0) return liveRecords;
  }
  return [];
}
