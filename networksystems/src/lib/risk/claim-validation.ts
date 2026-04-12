import type { ProcurementRecord } from '@/lib/api/procurement-ingest';
import type { RiskFlag } from '@/lib/risk/engine';

export type SupportingDocument = {
  recordId: string;
  sourceUrl: string;
  agency: string;
  vendor: string;
  boardActionDate?: string;
  excerpts: string[];
};

export type ClaimValidationResult = {
  flagId: string;
  isCorresponding: boolean;
  issues: string[];
  supportingDocuments: SupportingDocument[];
};

function normalize(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

export function validateClaimCorrespondence(
  flags: RiskFlag[],
  records: ProcurementRecord[]
): ClaimValidationResult[] {
  const recordById = new Map(records.map((record) => [record.id, record]));

  return flags.map((flag) => {
    const issues: string[] = [];
    const supportingIds = flag.supportingRecordIds && flag.supportingRecordIds.length > 0
      ? flag.supportingRecordIds
      : flag.recordId
        ? [flag.recordId]
        : [];

    if (supportingIds.length === 0) {
      issues.push('No supporting record IDs linked to this flag.');
    }

    const supportingDocuments: SupportingDocument[] = [];

    for (const id of supportingIds) {
      const record = recordById.get(id);
      if (!record) {
        issues.push(`Supporting record not found: ${id}`);
        continue;
      }

      if (record.jurisdiction !== flag.jurisdiction) {
        issues.push(`Jurisdiction mismatch for record ${id}.`);
      }
      if (normalize(record.agency) !== normalize(flag.agency)) {
        issues.push(`Agency mismatch for record ${id}.`);
      }

      const recordVendor = normalize(record.canonicalVendorName || record.vendor);
      const flagVendor = normalize(flag.vendor);
      if (!recordVendor || !flagVendor || (!recordVendor.includes(flagVendor) && !flagVendor.includes(recordVendor))) {
        issues.push(`Vendor mismatch for record ${id}.`);
      }

      if (!/^https?:\/\//.test(record.sourceUrl)) {
        issues.push(`Invalid source URL on record ${id}.`);
      }

      supportingDocuments.push({
        recordId: record.id,
        sourceUrl: record.sourceUrl,
        agency: record.agency,
        vendor: record.canonicalVendorName || record.vendor,
        boardActionDate: record.boardActionDate,
        excerpts: (record.sourceEvidence || []).map((item) => item.excerpt).filter(Boolean),
      });
    }

    if (supportingDocuments.length === 0) {
      issues.push('No resolvable supporting records.');
    }

    const hasAnyExcerpt = supportingDocuments.some((doc) => doc.excerpts.length > 0);
    if (!hasAnyExcerpt) {
      issues.push('No source excerpt captured in supporting records.');
    }

    if (flag.recordId) {
      const primaryRecord = recordById.get(flag.recordId);
      if (!primaryRecord) {
        issues.push(`Primary record not found: ${flag.recordId}`);
      } else if (primaryRecord.sourceUrl !== flag.sourceUrl) {
        issues.push('Flag source URL does not match primary record source URL.');
      }
    }

    return {
      flagId: flag.id,
      isCorresponding: issues.length === 0,
      issues,
      supportingDocuments,
    };
  });
}
