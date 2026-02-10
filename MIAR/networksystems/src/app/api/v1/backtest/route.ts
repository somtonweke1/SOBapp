/**
 * Historical Backtest API
 *
 * Generates ROI reports from historical constraint events
 * Proves platform value with documented past events
 */

import { NextRequest, NextResponse } from 'next/server';
import { historicalBacktester } from '@/services/historical-backtester';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const backtest = await historicalBacktester.runBacktest();

    if (format === 'report') {
      const report = await historicalBacktester.generateROIReport();
      return new Response(report, {
        headers: {
          'Content-Type': 'text/markdown'
        }
      });
    }

    // Return JSON summary
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          period: backtest.period,
          totalEvents: backtest.totalEvents,
          totalActualLosses: backtest.totalActualLosses,
          totalSavings: backtest.totalSavings,
          roi: backtest.averageROI,
          timeAdvantage: backtest.averageTimeAdvantage,
          confidence: backtest.confidence
        },
        events: backtest.events.map(e => ({
          id: e.event.id,
          date: e.event.date,
          type: e.event.type,
          description: e.event.description,
          actualLoss: e.comparison.actualLoss,
          projectedSavings: e.comparison.savings,
          savingsPercent: e.comparison.savingsPercent,
          timeAdvantage: e.comparison.timeAdvantage,
          optimalStrategy: e.platformAnalysis.optimalStrategy
        })),
        conclusions: {
          provenROI: `${backtest.averageROI.toFixed(1)}:1`,
          totalValueDelivered: `$${(backtest.totalSavings / 1000000).toFixed(1)}M`,
          averageDetectionSpeed: `${backtest.averageTimeAdvantage.toFixed(1)} hours faster`,
          confidence: `${(backtest.confidence * 100).toFixed(0)}%`
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Backtest API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate backtest report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
