import { NextRequest, NextResponse } from 'next/server';
import { buildBaltimorePropertyNetwork } from '@/services/forensics/baltimorePropertyNetwork';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { properties } = body;

    if (!Array.isArray(properties)) {
      return NextResponse.json({
        success: false,
        error: 'properties must be an array',
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Build Baltimore Property Network
    const network = await buildBaltimorePropertyNetwork(properties);

    return NextResponse.json({
      success: true,
      network: {
        nodes: network.nodes,
        edges: network.edges,
        network: network.network,
      },
      summary: {
        totalProperties: network.nodes.length,
        propertiesWithDPWErrors: network.nodes.filter(n => n.dpwAuditResult?.hasError).length,
        averageDistressScore: network.nodes.reduce((sum, n) => sum + n.distressScore, 0) / network.nodes.length,
        highDistressProperties: network.nodes.filter(n => n.distressScore > 70).length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Baltimore Network API error:', error);
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
    description: 'Baltimore Property Network API - 3D Network Visualization',
    endpoints: {
      network: {
        method: 'POST',
        body: {
          properties: 'array of property objects with: id, address, ward, section, lastSale, liens, dpwBillData (optional), position',
        },
      },
    },
    timestamp: new Date().toISOString(),
  });
}

