import { NextRequest, NextResponse } from 'next/server';
import MLPredictionsService from '@/services/ml-predictions-service';
import SCGEPSolver from '@/services/sc-gep-solver';
import { createMarylandSCGEPConfig, createAfricanMiningSCGEPConfig } from '@/services/sc-gep-enhanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prediction_type = 'all',
      region = 'maryland',
      materials = [],
      forecast_years = 5
    } = body;

    const mlService = new MLPredictionsService();

    // Get current solution for analysis
    const config = region === 'maryland'
      ? createMarylandSCGEPConfig('baseline')
      : createAfricanMiningSCGEPConfig('baseline');

    const solver = new SCGEPSolver(config);
    const currentSolution = await solver.solve();
    const bottlenecks = solver.analyzeBottlenecks();

    switch (prediction_type) {
      case 'price_forecasts':
        // Generate simulated historical data
        const historicalData = Array.from({ length: 24 }, (_, i) => ({
          date: new Date(Date.now() - (24 - i) * 30 * 24 * 60 * 60 * 1000),
          price: 50000 + Math.random() * 20000
        }));

        const forecasts: any = {};
        const targetMaterials = materials.length > 0 ? materials : ['lithium', 'cobalt', 'nickel'];

        for (const material of targetMaterials) {
          forecasts[material] = await mlService.forecastMaterialPrices(
            material,
            historicalData,
            forecast_years
          );
        }

        return NextResponse.json({
          success: true,
          prediction_type: 'price_forecasts',
          data: forecasts,
          timestamp: new Date().toISOString()
        });

      case 'bottlenecks':
        const bottleneckPredictions = await mlService.predictBottlenecks(
          config.materials,
          config.technologies,
          config.zones,
          [currentSolution]
        );

        return NextResponse.json({
          success: true,
          prediction_type: 'bottlenecks',
          data: bottleneckPredictions,
          timestamp: new Date().toISOString()
        });

      case 'recommendations':
        const recommendations = await mlService.generateOptimizationRecommendations(
          currentSolution,
          bottlenecks,
          [currentSolution]
        );

        return NextResponse.json({
          success: true,
          prediction_type: 'recommendations',
          data: recommendations,
          timestamp: new Date().toISOString()
        });

      case 'timing':
        const timingPredictions: any = {};

        for (const tech of config.technologies.slice(0, 3)) {
          for (const zone of config.zones.slice(0, 2)) {
            const key = `${tech.id}_${zone.id}`;
            timingPredictions[key] = await mlService.predictOptimalTiming(
              tech,
              zone,
              config.planningHorizon
            );
          }
        }

        return NextResponse.json({
          success: true,
          prediction_type: 'timing',
          data: timingPredictions,
          timestamp: new Date().toISOString()
        });

      case 'all':
      default:
        // Generate all predictions
        const [priceForecasts, bottleneckPreds, recs] = await Promise.all([
          (async () => {
            const forecasts: any = {};
            const defaultMaterials = ['lithium', 'cobalt', 'nickel', 'copper'];
            const historicalData = Array.from({ length: 24 }, (_, i) => ({
              date: new Date(Date.now() - (24 - i) * 30 * 24 * 60 * 60 * 1000),
              price: 50000 + Math.random() * 20000
            }));

            for (const material of defaultMaterials) {
              forecasts[material] = await mlService.forecastMaterialPrices(
                material,
                historicalData,
                forecast_years
              );
            }
            return forecasts;
          })(),
          mlService.predictBottlenecks(
            config.materials,
            config.technologies,
            config.zones,
            [currentSolution]
          ),
          mlService.generateOptimizationRecommendations(
            currentSolution,
            bottlenecks,
            [currentSolution]
          )
        ]);

        return NextResponse.json({
          success: true,
          prediction_type: 'comprehensive',
          data: {
            priceForecasts,
            bottleneckPredictions: bottleneckPreds,
            recommendations: recs,
            summary: {
              totalBottlenecks: bottleneckPreds.length,
              criticalBottlenecks: bottleneckPreds.filter(b => b.severity === 'critical').length,
              highPriorityRecommendations: recs.filter(r => r.priority === 'critical' || r.priority === 'high').length,
              avgConfidence: recs.reduce((sum, r) => sum + r.confidence, 0) / recs.length
            }
          },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('ML Predictions API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate predictions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'model_performance') {
      const mlService = new MLPredictionsService();

      // Train models with simulated data
      const simulatedData = Array.from({ length: 100 }, () => ({
        date: new Date(),
        value: Math.random() * 100
      }));

      const performance = await mlService.trainModels(simulatedData);

      return NextResponse.json({
        success: true,
        data: Object.fromEntries(performance),
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      service: 'ML Predictions Service',
      version: '1.0.0',
      available_predictions: [
        'price_forecasts',
        'bottlenecks',
        'recommendations',
        'timing',
        'all'
      ],
      models: ['ARIMA', 'LSTM', 'Prophet', 'EnsembleModel']
    });

  } catch (error) {
    console.error('ML Predictions API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
