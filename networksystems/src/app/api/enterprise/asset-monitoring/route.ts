import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;
const ASSET_CONNECTOR_URL = process.env.ASSET_MONITORING_CONNECTOR_URL;

// Production-grade Asset Monitoring API
export async function POST(request: NextRequest) {
  try {
    if (!ASSET_CONNECTOR_URL) {
      return NextResponse.json({
        success: false,
        error: 'Live asset monitoring connector is not configured',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const body = await request.json();
    const { clientId, assetIds, analysisType, timeRange } = body;

    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Client ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Real-time asset analysis
    const assets = await analyzeAssets(clientId, assetIds, analysisType, timeRange);

    // AI-powered predictive maintenance
    let maintenancePredictions = null;
    if (openai && analysisType === 'predictive_maintenance') {
      try {
        maintenancePredictions = await generateMaintenancePredictions(assets);
      } catch (error) {
        console.error('AI predictions error:', error);
      }
    }

    // Calculate cost savings
    const costSavings = calculateOptimizationSavings(assets);

    return NextResponse.json({
      success: true,
      clientId,
      assets,
      maintenancePredictions,
      costSavings,
      metadata: {
        analysisType,
        assetsAnalyzed: assets.length,
        timeRange,
        computationTime: Date.now(),
        confidenceLevel: assets.length > 0
          ? Math.max(0.5, Math.min(0.99, 1 - (assets.filter((a: any) => a.faultPrediction?.probability > 0.7).length / assets.length) * 0.4))
          : 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Asset monitoring error:', error);
    return NextResponse.json({
      success: false,
      error: 'Asset monitoring analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!ASSET_CONNECTOR_URL) {
      return NextResponse.json({
        success: false,
        error: 'Live asset monitoring connector is not configured',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const assetType = searchParams.get('assetType');
    const status = searchParams.get('status');

    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Client ID is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Get real-time asset status
    const assets = await getRealTimeAssets(clientId, { assetType, status });
    const alerts = await getActiveAlerts(clientId);
    const kpis = await calculateAssetKPIs(assets);

    return NextResponse.json({
      success: true,
      assets,
      alerts,
      kpis: {
        totalAssets: assets.length,
        operationalAssets: assets.filter((a: any) => a.status === 'operational').length,
        maintenanceRequired: assets.filter((a: any) => a.faultPrediction.probability > 0.7).length,
        averageEfficiency: assets.length > 0
          ? assets.reduce((sum: number, a: any) => sum + a.efficiency, 0) / assets.length
          : 0,
        totalUptime: assets.reduce((sum: number, a: any) => sum + a.uptime, 0),
        costSavingsThisMonth: kpis.monthlySavings,
        predictedFailures: kpis.predictedFailures,
        maintenanceOpportunities: kpis.maintenanceOpportunities
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Asset data retrieval error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve asset data',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Core Business Logic Functions
async function analyzeAssets(clientId: string, assetIds: string[], analysisType: string, timeRange: any) {
  return fetchConnector('assets/analyze', { clientId, assetIds, analysisType, timeRange });
}

async function getRealTimeAssets(clientId: string, filters: any) {
  return fetchConnector('assets/realtime', { clientId, filters });
}

async function getActiveAlerts(clientId: string) {
  return fetchConnector('alerts/active', { clientId });
}

async function calculateAssetKPIs(assets: any[]) {
  const operationalAssets = assets.filter(a => a.status === 'operational');
  const monthlySavings = assets.reduce((sum, a) => {
    const emergency = a.businessImpact?.emergencyRepairCost || 0;
    const maintenance = a.businessImpact?.maintenanceCost || 0;
    const probability = a.faultPrediction?.probability || 0;
    return sum + Math.max(0, emergency - maintenance) * probability;
  }, 0);

  return {
    monthlySavings,
    predictedFailures: assets.filter(a => a.faultPrediction.probability > 0.7).length,
    maintenanceOpportunities: assets.filter(a =>
      a.faultPrediction.probability > 0.3 && a.faultPrediction.probability < 0.7
    ).length,
    totalRevenueAtRisk: assets.reduce((sum, a) => sum + (a.businessImpact?.dailyRevenue || 0), 0),
    avgEfficiencyGain: operationalAssets.length > 0
      ? operationalAssets.reduce((sum, a) => sum + (a.efficiency - 75), 0) / operationalAssets.length
      : 0
  };
}

async function fetchConnector(path: string, payload: Record<string, unknown>) {
  if (!ASSET_CONNECTOR_URL) {
    throw new Error('Live asset monitoring connector is not configured');
  }

  const response = await fetch(`${ASSET_CONNECTOR_URL.replace(/\/$/, '')}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store'
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Connector request failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function generateMaintenancePredictions(assets: any[]) {
  if (!openai) {
    return {
      priorityRanking: assets
        .sort((a, b) => b.faultPrediction.probability - a.faultPrediction.probability)
        .slice(0, 3)
        .map((asset, index) => ({
          rank: index + 1,
          assetId: asset.assetId,
          urgency: asset.faultPrediction.probability > 0.7 ? 'critical' : 'medium',
          estimatedSavings: asset.businessImpact.emergencyRepairCost - asset.businessImpact.maintenanceCost,
          recommendedAction: asset.faultPrediction.recommendedAction
        })),
      totalPotentialSavings: assets.reduce((sum, a) =>
        sum + (a.businessImpact.emergencyRepairCost - a.businessImpact.maintenanceCost), 0
      ),
      confidence: Math.max(
        0.5,
        Math.min(0.99, 1 - (assets.filter((a) => a.faultPrediction.probability > 0.7).length / Math.max(1, assets.length)) * 0.35)
      )
    };
  }

  const assetSummary = assets.map(asset => ({
    id: asset.assetId,
    type: asset.assetType,
    efficiency: asset.efficiency,
    faultProbability: asset.faultPrediction.probability,
    metrics: asset.realTimeMetrics,
    businessImpact: asset.businessImpact.dailyRevenue
  }));

  const prompt = `Analyze these mining assets for predictive maintenance optimization:

${JSON.stringify(assetSummary, null, 2)}

Provide:
1. Priority ranking for maintenance interventions
2. Optimal maintenance scheduling to minimize downtime
3. Cost-benefit analysis for each recommended action
4. Risk assessment for production continuity
5. Resource allocation recommendations

Focus on maximizing operational efficiency and ROI. Format as JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a mining operations expert specializing in predictive maintenance and asset optimization for maximum profitability."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error('AI maintenance prediction error:', error);
    return {
      priorityRanking: assets
        .sort((a, b) => b.faultPrediction.probability - a.faultPrediction.probability)
        .slice(0, 3)
        .map((asset, index) => ({
          rank: index + 1,
          assetId: asset.assetId,
          urgency: asset.faultPrediction.probability > 0.7 ? 'critical' : 'medium',
          estimatedSavings: asset.businessImpact.emergencyRepairCost - asset.businessImpact.maintenanceCost,
          recommendedAction: asset.faultPrediction.recommendedAction
        })),
      totalPotentialSavings: assets.reduce((sum, a) =>
        sum + (a.businessImpact.emergencyRepairCost - a.businessImpact.maintenanceCost), 0
      ),
      confidence: Math.max(
        0.5,
        Math.min(0.99, 1 - (assets.filter((a) => a.faultPrediction.probability > 0.7).length / Math.max(1, assets.length)) * 0.35)
      )
    };
  }
}

function calculateOptimizationSavings(assets: any[]) {
  const totalEmergencyRepairCost = assets.reduce((sum, asset) => {
    return sum + (asset.faultPrediction.probability * asset.businessImpact.emergencyRepairCost);
  }, 0);

  const totalPlannedMaintenanceCost = assets.reduce((sum, asset) => {
    return sum + asset.businessImpact.maintenanceCost;
  }, 0);

  const potentialSavings = totalEmergencyRepairCost - totalPlannedMaintenanceCost;
  const productionOptimization = assets.reduce((sum, asset) => {
    if (asset.status === 'operational' && asset.efficiency < 90) {
      const improvementPotential = (90 - asset.efficiency) / 100;
      return sum + (asset.businessImpact.dailyRevenue * improvementPotential * 30);
    }
    return sum;
  }, 0);

  return {
    preventedFailureCosts: potentialSavings,
    productionOptimization,
    totalMonthlySavings: potentialSavings + productionOptimization,
    annualizedSavings: (potentialSavings + productionOptimization) * 12,
    roi: ((potentialSavings + productionOptimization) * 12) / 45000 * 100
  };
}
