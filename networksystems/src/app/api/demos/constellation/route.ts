import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Demo endpoint disabled. Only live data endpoints are permitted.',
    },
    { status: 410 }
  );
}
