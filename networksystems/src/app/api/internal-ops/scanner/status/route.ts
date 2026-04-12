import { NextResponse } from 'next/server';
import { getScannerStatus } from '@/lib/risk/auto-scanner';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const status = await getScannerStatus();
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error('Scanner status error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to read scanner status' }, { status: 500 });
  }
}
