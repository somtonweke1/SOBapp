import { POST as closeLoopPost } from '@/app/api/public-risk/closure/route';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = closeLoopPost;

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: '/api/bridge/close',
    method: 'POST',
    aliasOf: '/api/public-risk/closure',
    note: 'Use POST with loop/intervention payload to close a bridge.',
  });
}
