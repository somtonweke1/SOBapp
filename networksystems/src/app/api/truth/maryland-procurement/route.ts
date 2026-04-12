import { NextResponse } from 'next/server';
import { runMarylandProcurementTruthCase, getCurrentReviewStats } from '@/lib/risk/truth-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await runMarylandProcurementTruthCase();
    const stats = getCurrentReviewStats();
    return NextResponse.json({
      success: true,
      report,
      reviewStats: stats,
    });
  } catch (error) {
    console.error('Truth case generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate Maryland procurement truth case',
      },
      { status: 500 }
    );
  }
}
