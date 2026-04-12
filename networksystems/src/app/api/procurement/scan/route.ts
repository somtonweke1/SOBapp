import { NextResponse } from 'next/server';
import { buildLiveProcurementScanResult } from '@/lib/api/procurement-live';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await buildLiveProcurementScanResult();
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' },
  });
}
