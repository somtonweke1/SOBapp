import { NextRequest, NextResponse } from 'next/server';

/**
 * Secure API endpoint for mining stock prices
 * All external API calls happen server-side
 */
export async function GET(request: NextRequest) {
  try {
    const stockData = await getMiningStockPrices();

    return NextResponse.json({
      success: true,
      data: stockData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Mining stocks API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch mining stock prices',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function getMiningStockPrices() {
  const miningStocks = {
    'BHP': 'bhp_billiton',
    'RIO': 'rio_tinto',
    'VALE': 'vale',
    'FCX': 'freeport_mcmoran',
    'ANG.JO': 'anglogold_ashanti',
    'HAR.JO': 'harmony_gold',
    'SSW.JO': 'sibanye_stillwater',
    'GFI.JO': 'gold_fields',
  };

  const results = await Promise.allSettled(
    Object.entries(miningStocks).map(async ([symbol, company]) => {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
        { next: { revalidate: 30 } }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const meta = data.chart?.result?.[0]?.meta;

      if (!meta) return null;

      const current = meta.regularMarketPrice;
      const previous = meta.previousClose;
      const change = ((current - previous) / previous) * 100;

      return {
        [company]: {
          symbol,
          current,
          previous,
          daily_change: change,
          volume: meta.regularMarketVolume || 0,
          market_cap: meta.marketCap || 0,
          timestamp: new Date().toISOString()
        }
      };
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
    .reduce((acc, r) => ({ ...acc, ...r.value }), {});
}
