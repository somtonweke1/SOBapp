import { performForensicScan, type ForensicReport } from '@/lib/api/forensic-scan';

export type BulkAuditSkipped = {
  address: string;
  reason: string;
};

export type BulkAuditResult = {
  successful: ForensicReport[];
  skipped: BulkAuditSkipped[];
  summary: {
    requested: number;
    printed: number;
    skipped: number;
  };
};

export async function generateBulkPackets(addresses: string[]): Promise<BulkAuditResult> {
  const sanitized = addresses.map((a) => a.trim()).filter(Boolean);

  const settled = await Promise.allSettled(
    sanitized.map((address) => performForensicScan(address, 'asset'))
  );

  const successful: ForensicReport[] = [];
  const skipped: BulkAuditSkipped[] = [];

  settled.forEach((result, index) => {
    const address = sanitized[index];

    if (result.status === 'fulfilled') {
      const report = result.value;
      if (report.status === 'success') {
        successful.push(report);
        return;
      }

      skipped.push({
        address,
        reason: report.decision.summary || 'No verifiable property record.',
      });
      return;
    }

    skipped.push({
      address,
      reason: result.reason instanceof Error ? result.reason.message : 'Unhandled scan error.',
    });
  });

  return {
    successful,
    skipped,
    summary: {
      requested: sanitized.length,
      printed: successful.length,
      skipped: skipped.length,
    },
  };
}
