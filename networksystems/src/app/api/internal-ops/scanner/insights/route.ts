import { NextRequest, NextResponse } from 'next/server';
import { getScannerInsights } from '@/lib/risk/scanner-insights';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(request: NextRequest): boolean {
  const secrets = [
    process.env.SCANNER_CRON_SECRET,
    process.env.CRON_SECRET,
    process.env.OPS_ACCESS_KEY,
    process.env.STONEBRIDGE_ACCESS_CODE,
  ].filter((value): value is string => !!value && value.trim().length > 0);

  if (secrets.length === 0) return true;

  const authHeader = request.headers.get('authorization') || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const querySecret = request.nextUrl.searchParams.get('secret') || '';
  return secrets.includes(bearer) || secrets.includes(querySecret);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const daysRaw = request.nextUrl.searchParams.get('days');
  const days = Math.min(30, Math.max(1, Number(daysRaw || '7') || 7));

  try {
    const insights = await getScannerInsights(days);
    return NextResponse.json({ ok: true, insights });
  } catch (error) {
    console.error('Scanner insights error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to load scanner insights' }, { status: 500 });
  }
}
