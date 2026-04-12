import { NextResponse } from 'next/server';

function unavailable() {
  return NextResponse.json(
    {
      success: false,
      error: 'Database API disabled: no synthetic or in-memory data endpoints are allowed.',
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

export async function PUT() {
  return unavailable();
}

export async function DELETE() {
  return unavailable();
}
