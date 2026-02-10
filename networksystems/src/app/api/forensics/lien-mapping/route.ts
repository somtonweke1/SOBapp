import { NextRequest, NextResponse } from 'next/server';
import {
  buildLienNetwork,
  calculatePropertyCentrality,
  findDistressedOpportunities,
} from '@/services/forensics/lienMapping';
import type { PropertyLien } from '@/services/forensics/lienMapping';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { liens, action } = body;

    if (!Array.isArray(liens)) {
      return NextResponse.json({
        success: false,
        error: 'liens must be an array',
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    // Build network
    const network = buildLienNetwork(liens as PropertyLien[]);

    // Calculate centrality
    const centrality = calculatePropertyCentrality(network.nodes, network.edges);

    // Find distressed opportunities
    const opportunities = findDistressedOpportunities(network.nodes, network.clusters);

    if (action === 'opportunities') {
      return NextResponse.json({
        success: true,
        opportunities: opportunities.slice(0, 20), // Top 20 opportunities
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      network: {
        nodes: network.nodes.map(node => ({
          ...node,
          centrality: centrality.get(node.id),
        })),
        edges: network.edges,
        clusters: network.clusters,
      },
      opportunities: opportunities.slice(0, 10), // Top 10 for summary
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Lien Mapping API error:', error);
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
    description: 'Baltimore Property Lien Mapping API',
    endpoints: {
      network: {
        method: 'POST',
        body: {
          liens: 'array of PropertyLien objects',
          action: 'optional: "opportunities" to get only distressed deals',
        },
      },
    },
    timestamp: new Date().toISOString(),
  });
}

