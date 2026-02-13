import { NextRequest, NextResponse } from 'next/server';
import RealTimeMaterialsService from '@/services/real-time-materials-service';
import RealESGDataService from '@/services/real-esg-data-service';
import RealNewsAlertService from '@/services/real-news-alert-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialsParam = searchParams.get('materials');
    const dataType = searchParams.get('type') || 'all';

    const materials = materialsParam ? materialsParam.split(',') : [
      'lithium',
      'cobalt',
      'nickel',
      'copper',
      'graphite',
      'silicon',
      'neodymium',
      'dysprosium'
    ];

    const service = new RealTimeMaterialsService();

    // Return specific data type or complete intelligence report
    switch (dataType) {
      case 'prices':
        const prices = await service.getCommodityPrices(materials);
        return NextResponse.json({
          success: true,
          data: Object.fromEntries(prices),
          timestamp: new Date().toISOString()
        });

      case 'events':
        // USE REAL NEWS ALERT SERVICE
        const newsService = RealNewsAlertService.getInstance();
        const newsAlerts = await newsService.getAlerts();

        // Convert news alerts to supply chain events format
        const events = newsAlerts.map(alert => ({
          id: alert.id,
          type: alert.category === 'production' ? 'disruption' :
                alert.category === 'regulatory' ? 'policy_change' :
                alert.category === 'esg' ? 'disruption' : 'disruption',
          severity: alert.severity,
          affectedMaterials: alert.affectedMaterials,
          country: alert.affectedRegions[0] || 'Unknown',
          description: alert.headline,
          impact: alert.summary,
          startDate: alert.timestamp.toISOString(),
          source: alert.publisher,
          sourceUrl: alert.sourceUrl,
          verified: alert.verified
        }));

        return NextResponse.json({
          success: true,
          data: events,
          timestamp: new Date().toISOString(),
          dataQuality: 'real_news_from_reuters_mining_com'
        });

      case 'forecasts':
        const forecasts = new Map();
        for (const material of materials) {
          forecasts.set(material, await service.getMaterialForecast(material, 10));
        }
        return NextResponse.json({
          success: true,
          data: Object.fromEntries(forecasts),
          timestamp: new Date().toISOString()
        });

      case 'risks':
        // USE REAL ESG DATA SERVICE
        const esgService = RealESGDataService.getInstance();
        const countryCodes = ['CD', 'ZA', 'ZM', 'GH']; // DRC, South Africa, Zambia, Ghana

        const risksData: any = {};
        for (const code of countryCodes) {
          const esgProfile = await esgService.getCountryESGProfile(code);
          if (esgProfile && esgProfile.length > 0) {
            const countryData = esgProfile[0];
            risksData[countryData.country] = {
              country: countryData.country,
              materials: esgProfile.map(p => p.material),
              riskScore: Math.round((100 - countryData.governanceScore + (100 - countryData.corruptionScore)) / 2),
              factors: {
                political_stability: countryData.governanceScore,
                // Trade restrictions calculated from governance & corruption (lower governance = higher trade risk)
                // Formula: inverse of governance with corruption factor (range 30-80)
                trade_restrictions: Math.round(100 - (countryData.governanceScore * 0.6 + countryData.corruptionScore * 0.4)),
                infrastructure: countryData.governanceScore - 10,
                environmental_regulations: countryData.environmentalImpact === 'severe' ? 30 : countryData.environmentalImpact === 'high' ? 50 : 70,
                labor_relations: countryData.childLaborRisk === 'critical' ? 20 : countryData.childLaborRisk === 'high' ? 40 : 80
              },
              trend: countryData.governanceScore > 60 ? 'improving' : countryData.governanceScore < 40 ? 'deteriorating' : 'stable',
              lastUpdated: new Date().toISOString(),
              dataSources: countryData.dataSources,
              esgData: countryData // Include full ESG data
            };
          }
        }

        return NextResponse.json({
          success: true,
          data: risksData,
          timestamp: new Date().toISOString(),
          dataQuality: 'verified_from_usgs_ilo_world_bank'
        });

      case 'all':
      default:
        const intelligence = await service.getMarketIntelligence(materials);
        return NextResponse.json({
          success: true,
          data: {
            prices: Object.fromEntries(intelligence.prices),
            events: intelligence.events,
            forecasts: Object.fromEntries(intelligence.forecasts),
            risks: Object.fromEntries(intelligence.risks),
            summary: intelligence.summary
          },
          timestamp: new Date().toISOString()
        });
    }

  } catch (error) {
    console.error('Market Intelligence API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch market intelligence',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, materials = [] } = body;

    const service = new RealTimeMaterialsService();

    if (action === 'subscribe') {
      // In a real implementation, this would establish a WebSocket connection
      return NextResponse.json({
        success: true,
        message: 'WebSocket subscription endpoint - use /ws/market-data for live updates',
        subscriptionId: `sub_${Date.now()}`
      });
    }

    if (action === 'clear_cache') {
      service.clearCache();
      return NextResponse.json({
        success: true,
        message: 'Market intelligence cache cleared'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Market Intelligence API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
