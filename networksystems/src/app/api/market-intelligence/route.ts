import { NextRequest, NextResponse } from 'next/server';
import { marketIntelligence } from '@/services/real-time-market-intelligence';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';
    
    switch (type) {
      case 'summary':
        const summary = await marketIntelligence.getMarketSummary();
        return NextResponse.json({
          success: true,
          data: summary,
          timestamp: new Date().toISOString()
        });

      case 'materials':
        const materials = await marketIntelligence.getMarketData();
        const materialsArray = materials instanceof Map 
          ? Array.from(materials.entries()).map(([id, data]) => ({ id, ...data }))
          : [{ id: 'unknown', ...materials }];
        return NextResponse.json({
          success: true,
          data: materialsArray,
          timestamp: new Date().toISOString()
        });

      case 'alerts':
        const severity = searchParams.get('severity');
        const region = searchParams.get('region');
        const alerts = await marketIntelligence.getSupplyChainAlerts(severity || undefined, region || undefined);
        return NextResponse.json({
          success: true,
          data: alerts,
          timestamp: new Date().toISOString()
        });

      case 'geopolitical':
        const geoRegion = searchParams.get('region');
        const geoRisks = await marketIntelligence.getGeopoliticalRisks(geoRegion || undefined);
        return NextResponse.json({
          success: true,
          data: geoRisks,
          timestamp: new Date().toISOString()
        });

      case 'esg':
        const esgRegion = searchParams.get('region');
        const esgMaterial = searchParams.get('material');
        const esgData = await marketIntelligence.getESGCompliance(esgRegion || undefined, esgMaterial || undefined);
        return NextResponse.json({
          success: true,
          data: esgData,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid type parameter. Supported types: summary, materials, alerts, geopolitical, esg'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Market Intelligence API Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
