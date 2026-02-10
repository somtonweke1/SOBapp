import { NextRequest, NextResponse } from 'next/server';
import LiveDataService from '@/services/live-data-service';

/**
 * Live Data API Endpoint
 * Provides real-time market data, commodity prices, mining operations,
 * and supply chain intelligence to the frontend
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type') || 'all';

    const liveDataService = LiveDataService.getInstance();

    let responseData: any;

    switch (dataType) {
      case 'commodities':
        responseData = await liveDataService.getCommodityPrices();
        break;

      case 'mining_ops':
        responseData = await liveDataService.getMiningOperationsData();
        break;

      case 'shipping':
        responseData = await liveDataService.getShippingData();
        break;

      case 'intelligence':
        responseData = await liveDataService.getMarketIntelligence();
        break;

      case 'financial':
        responseData = await liveDataService.getFinancialData();
        break;

      case 'portfolio':
        responseData = await liveDataService.getPortfolioUpdates();
        break;

      case 'all':
      default:
        responseData = await liveDataService.getAllLiveData();
        break;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
      type: dataType
    });

  } catch (error) {
    console.error('Live Data API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch live data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST endpoint for specific data requests with filters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataTypes = ['all'], filters = {} } = body;

    const liveDataService = LiveDataService.getInstance();
    const results: any = {};

    // Fetch multiple data types in parallel
    const promises = dataTypes.map(async (type: string) => {
      switch (type) {
        case 'commodities':
          return { type, data: await liveDataService.getCommodityPrices() };
        case 'mining_ops':
          return { type, data: await liveDataService.getMiningOperationsData() };
        case 'shipping':
          return { type, data: await liveDataService.getShippingData() };
        case 'intelligence':
          return { type, data: await liveDataService.getMarketIntelligence() };
        case 'financial':
          return { type, data: await liveDataService.getFinancialData() };
        case 'portfolio':
          return { type, data: await liveDataService.getPortfolioUpdates() };
        default:
          return { type, data: await liveDataService.getAllLiveData() };
      }
    });

    const resolvedData = await Promise.all(promises);
    resolvedData.forEach(({ type, data }) => {
      results[type] = data;
    });

    return NextResponse.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      requestedTypes: dataTypes
    });

  } catch (error) {
    console.error('Live Data API POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch live data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
