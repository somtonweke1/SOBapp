import { NextResponse } from 'next/server';

function unavailable() {
  return NextResponse.json(
    {
      success: false,
      error: 'ML predictions endpoint disabled: synthetic model outputs are not permitted.',
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
