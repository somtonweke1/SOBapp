/**
 * Live Monitoring API
 *
 * Production endpoint for real-time constraint monitoring
 * Uses actual data from EIA, weather APIs, and commodity prices
 */

import { NextRequest, NextResponse } from 'next/server';
import { realTimeDataConnector } from '@/services/real-time-data-connectors';
import { aiConstraintAnalyzer } from '@/services/ai-constraint-analyzer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type') || 'all';

    switch (dataType) {
      case 'prices':
        const gasPrice = await realTimeDataConnector.getNaturalGasPrices();
        return NextResponse.json({
          success: true,
          data: gasPrice,
          source: 'EIA Henry Hub Spot Price',
          timestamp: new Date().toISOString()
        });

      case 'demand':
        const region = searchParams.get('region') as 'US' | 'MISO' | 'PJM' | 'ERCOT' || 'PJM';
        const demand = await realTimeDataConnector.getElectricityDemand(region);
        return NextResponse.json({
          success: true,
          data: demand,
          region,
          source: 'EIA Hourly Electricity Demand',
          timestamp: new Date().toISOString()
        });

      case 'weather':
        const lat = parseFloat(searchParams.get('lat') || '39.2904');
        const lon = parseFloat(searchParams.get('lon') || '-76.6122');
        const weather = await realTimeDataConnector.getWeatherConditions(lat, lon);
        return NextResponse.json({
          success: true,
          data: weather,
          source: 'Open-Meteo Weather API',
          timestamp: new Date().toISOString()
        });

      case 'constraints':
        const constraints = await realTimeDataConnector.detectConstraints();

        // Analyze each constraint with AI
        const analyses = await Promise.all(
          constraints.map(c => aiConstraintAnalyzer.analyzeConstraint(c))
        );

        return NextResponse.json({
          success: true,
          data: {
            constraints,
            analyses,
            summary: {
              total: constraints.length,
              critical: constraints.filter(c => c.severity === 'critical').length,
              high: constraints.filter(c => c.severity === 'high').length,
              totalEstimatedImpact: constraints.reduce((sum, c) => sum + c.estimatedImpact, 0)
            }
          },
          timestamp: new Date().toISOString()
        });

      case 'all':
      default:
        const [gas, elecDemand, wxData, detected] = await Promise.all([
          realTimeDataConnector.getNaturalGasPrices(),
          realTimeDataConnector.getElectricityDemand('PJM'),
          realTimeDataConnector.getWeatherConditions(39.2904, -76.6122),
          realTimeDataConnector.detectConstraints()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            gasPrice: gas,
            demand: elecDemand,
            weather: wxData,
            constraints: detected,
            summary: {
              constraintsDetected: detected.length,
              criticalAlerts: detected.filter(c => c.severity === 'critical').length,
              totalExposure: detected.reduce((sum, c) => sum + c.estimatedImpact, 0)
            }
          },
          sources: {
            gas: 'EIA Henry Hub',
            demand: 'EIA Hourly Data',
            weather: 'Open-Meteo',
            constraints: 'Real-time analysis'
          },
          timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Live monitoring API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch live monitoring data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
