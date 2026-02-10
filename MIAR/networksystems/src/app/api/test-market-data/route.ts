import { NextResponse } from 'next/server';
import RealMarketDataService from '@/services/real-market-data-service';

export async function GET() {
  try {
    const marketService = RealMarketDataService.getInstance();

    // Test real API calls
    const [commodities, health, crypto] = await Promise.allSettled([
      marketService.getRealCommodityPrices(),
      marketService.checkAPIHealth(),
      marketService.getCryptoPrices()
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        commodities: commodities.status === 'fulfilled' ? commodities.value : { error: commodities.reason },
        api_health: health.status === 'fulfilled' ? health.value : { error: health.reason },
        crypto: crypto.status === 'fulfilled' ? crypto.value : { error: crypto.reason }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}