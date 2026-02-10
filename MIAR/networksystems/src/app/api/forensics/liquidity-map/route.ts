import { NextRequest, NextResponse } from 'next/server';
import {
  buildLenderNetwork,
  calculateLenderCentrality,
  calculateZipCodeCentrality,
  generateLiquidityMap,
} from '@/services/forensics/lenderCentrality';
import type { Deal } from '@/services/forensics/lenderCentrality';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deals } = body;

    if (!Array.isArray(deals)) {
      return NextResponse.json({
        success: false,
        error: 'deals must be an array',
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Build network
    const network = buildLenderNetwork(deals as Deal[]);

    // Calculate centrality metrics
    const lenderCentrality = calculateLenderCentrality(
      network.lenderNodes,
      network.zipCodeNodes,
      network.edges,
      network.lenders
    );

    const zipCodeCentrality = calculateZipCodeCentrality(
      network.lenderNodes,
      network.zipCodeNodes,
      network.edges,
      deals as Deal[]
    );

    // Generate liquidity map
    const liquidityMap = generateLiquidityMap(zipCodeCentrality, lenderCentrality);

    return NextResponse.json({
      success: true,
      liquidityMap,
      lenderCentrality: Array.from(lenderCentrality.values()),
      zipCodeCentrality: Array.from(zipCodeCentrality.values()),
      network: {
        lenderNodes: network.lenderNodes,
        zipCodeNodes: network.zipCodeNodes,
        edges: network.edges,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Liquidity Map API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    description: 'Baltimore Liquidity Map API - Shows where money is flowing',
    endpoints: {
      liquidityMap: {
        method: 'POST',
        body: {
          deals: 'array of Deal objects',
        },
      },
    },
    timestamp: new Date().toISOString(),
  });
}

