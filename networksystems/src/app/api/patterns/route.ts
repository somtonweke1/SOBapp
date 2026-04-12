import { NextRequest, NextResponse } from 'next/server';
import { exportDealRecordsCsv, getPatternLibraryData } from '@/lib/patterns';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format');

  if (format === 'csv') {
    const csv = await exportDealRecordsCsv();
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="deal-records.csv"',
      },
    });
  }

  const data = await getPatternLibraryData();
  return NextResponse.json(data);
}
