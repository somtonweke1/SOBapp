import { NextRequest, NextResponse } from 'next/server';
import { mlBottleneckPredictor } from '@/services/ml-bottleneck-predictor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'predictions';
    
    switch (type) {
      case 'predictions':
        const filter = {
          material: searchParams.get('material') || undefined,
          region: searchParams.get('region') || undefined,
          severity: searchParams.get('severity') || undefined,
          timeframe: searchParams.get('timeframe') || undefined
        };
        
        const predictions = await mlBottleneckPredictor.getPredictions(filter);
        return NextResponse.json({
          success: true,
          data: predictions,
          metadata: {
            total: predictions.length,
            timestamp: new Date().toISOString()
          }
        });

      case 'models':
        const models = await mlBottleneckPredictor.getModelPerformance();
        return NextResponse.json({
          success: true,
          data: models,
          timestamp: new Date().toISOString()
        });

      case 'training':
        const trainingSummary = await mlBottleneckPredictor.getTrainingDataSummary();
        return NextResponse.json({
          success: true,
          data: trainingSummary,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter. Supported types: predictions, models, training'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('ML Predictions API Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'retrain':
        const retrainResult = await mlBottleneckPredictor.retrainModels();
        return NextResponse.json({
          success: retrainResult,
          message: retrainResult ? 'Models retraining initiated' : 'Models already training',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: retrain'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('ML Predictions API Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

