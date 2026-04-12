import { NextResponse } from 'next/server';
import { ingestProcurementData } from '@/lib/api/procurement-ingest';
import { analyzePortfolioRisk } from '@/lib/risk/engine';
import { resolveProcurementVendors } from '@/lib/risk/vendor-resolution';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const records = await ingestProcurementData();
    const { records: resolvedRecords, entities } = resolveProcurementVendors(records);
    const flags = analyzePortfolioRisk(records);

    const entityExposure = new Map<string, { exposure: number; flags: number; strict: number }>();

    for (const flag of flags) {
      const id = flag.vendorEntityId || `VENDOR:${flag.vendor}`;
      const current = entityExposure.get(id) || { exposure: 0, flags: 0, strict: 0 };
      current.exposure += flag.exposure;
      current.flags += 1;
      if (flag.basis === 'STRICT_LAW') current.strict += 1;
      entityExposure.set(id, current);
    }

    const response = entities
      .map((entity) => {
        const stats = entityExposure.get(entity.id) || { exposure: 0, flags: 0, strict: 0 };
        const contracts = resolvedRecords.filter((record) => record.vendorEntityId === entity.id).length;
        return {
          ...entity,
          contracts,
          exposure: stats.exposure,
          flags: stats.flags,
          strictFlags: stats.strict,
        };
      })
      .sort((a, b) => b.exposure - a.exposure);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: response.length,
      entities: response,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resolve vendor entities' },
      { status: 500 }
    );
  }
}
