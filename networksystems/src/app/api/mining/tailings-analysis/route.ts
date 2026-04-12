import { NextResponse } from 'next/server';

function unavailable() {
  return NextResponse.json(
    {
      success: false,
      error: 'Tailings analysis endpoint disabled until a live-data implementation is available.',
      timestamp: new Date().toISOString(),
    },
    { status: 410 }
  );
}

export async function GET() {
  return unavailable();
}

export async function POST() {
  return unavailable();
}
