import { NextResponse } from 'next/server';

function unavailable() {
  return NextResponse.json(
    {
      success: false,
      error: 'Mining database demo endpoint disabled. Use a live persistence backend only.',
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

export async function DELETE() {
  return unavailable();
}
