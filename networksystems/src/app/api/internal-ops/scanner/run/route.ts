import { NextRequest, NextResponse } from 'next/server';
import { runAutoScanner } from '@/lib/risk/auto-scanner';

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
  const cronHeader = request.headers.get('x-cron-secret') || '';
  const querySecret = request.nextUrl.searchParams.get('secret') || '';
  return secrets.includes(bearer) || secrets.includes(cronHeader) || secrets.includes(querySecret);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAutoScanner('cron');
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('Auto scanner cron error:', error);
    return NextResponse.json({ ok: false, error: 'Scanner run failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runAutoScanner('manual');
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('Auto scanner manual error:', error);
    return NextResponse.json({ ok: false, error: 'Scanner run failed' }, { status: 500 });
  }
}
