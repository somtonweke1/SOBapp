import { NextRequest, NextResponse } from 'next/server';
import { CommunityDetection, analyzeMiningCommunities, type NetworkData } from '@/lib/network-science-algorithms';

/**
 * POST /api/mining/market-structure
 *
 * Advanced market structure analysis for mining networks
 *
 * Features:
 * - Community detection (Louvain, Girvan-Newman, Label Propagation)
 * - Modularity analysis
 * - Market consolidation tracking
 * - Herfindahl-Hirschman Index (HHI) calculation
 * - Strategic insights generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { network, analysis_type, options = {} } = body;

    if (!network || !network.nodes || !network.edges) {
      return NextResponse.json({
        success: false,
        error: 'Invalid network data. Must include nodes and edges arrays.',
      }, { status: 400 });
    }

    const startTime = Date.now();

    let results: any;

    switch (analysis_type) {
      case 'community_detection': {
        const algorithm = options.algorithm || 'louvain';

        switch (algorithm) {
          case 'louvain':
            results = CommunityDetection.louvain(network, options);
            break;
          case 'girvan_newman':
            results = CommunityDetection.girvanNewman(network, options.targetCommunities);
            break;
          case 'label_propagation':
            results = CommunityDetection.labelPropagation(network, options);
            break;
          case 'hierarchical':
            results = CommunityDetection.hierarchicalAgglomerative(network, options);
            break;
          case 'all':
            results = {
              louvain: CommunityDetection.louvain(network),
              label_propagation: CommunityDetection.labelPropagation(network),
              comparison: {
                algorithm_speeds: {
                  louvain: 'O(n log n) - Fast',
                  label_propagation: 'O(m) - Fastest',
                  girvan_newman: 'O(m²n) - Slow but accurate'
                },
                best_for: {
                  louvain: 'Large networks, general-purpose',
                  label_propagation: 'Very large networks, speed critical',
                  girvan_newman: 'Hierarchical insights, smaller networks'
                }
              }
            };
            break;
          default:
            return NextResponse.json({
              success: false,
              error: `Unknown algorithm: ${algorithm}`,
            }, { status: 400 });
        }
        break;
      }

      case 'market_structure': {
        const marketAnalysis = CommunityDetection.analyzeMarketStructure(network);
        const communities = CommunityDetection.louvain(network);

        // Generate detailed community profiles
        const communityProfiles = Array.from(
          new Set(communities.communities.values())
        ).map(commId => {
          const members = Array.from(communities.communities.entries())
            .filter(([_, comm]) => comm === commId)
            .map(([nodeId, _]) => {
              const node = network.nodes.find((n: any) => n.id === nodeId);
              return {
                id: nodeId,
                label: node?.label || node?.name || nodeId,
                ...node
              };
            });

          // Calculate community characteristics
          const totalProduction = members.reduce((sum: number, node: any) => {
            return sum + (node.production?.annual_production || 0);
          }, 0);

          const primaryCommodities = members.reduce((acc: any, node: any) => {
            const commodity = node.production?.primary_commodity;
            if (commodity) {
              acc[commodity] = (acc[commodity] || 0) + 1;
            }
            return acc;
          }, {});

          return {
            community_id: commId,
            size: members.length,
            members: members.map(m => ({ id: m.id, label: m.label })),
            characteristics: {
              total_production: totalProduction,
              primary_commodities: primaryCommodities,
              avg_gdp_contribution: members.reduce((sum: number, n: any) =>
                sum + (n.economic_impact?.gdp_contribution_percent || 0), 0) / members.length,
              total_employment: members.reduce((sum: number, n: any) =>
                sum + (n.economic_impact?.employment || 0), 0)
            }
          };
        });

        results = {
          ...marketAnalysis,
          community_profiles: communityProfiles,
          modularity_score: communities.modularity,
          interpretation: interpretModularity(communities.modularity),
          consolidation_risk: assessConsolidationRisk(marketAnalysis.herfindahl_index)
        };
        break;
      }

      case 'consolidation_tracking': {
        const { historical_networks } = options;

        if (!historical_networks || !Array.isArray(historical_networks)) {
          return NextResponse.json({
            success: false,
            error: 'historical_networks array required for consolidation tracking',
          }, { status: 400 });
        }

        const trends = CommunityDetection.trackConsolidationTrends(historical_networks);

        // Calculate trend direction
        const recentModularity = trends.slice(-5).map(t => t.modularity);
        const avgRecent = recentModularity.reduce((a, b) => a + b, 0) / recentModularity.length;
        const olderModularity = trends.slice(0, 5).map(t => t.modularity);
        const avgOlder = olderModularity.reduce((a, b) => a + b, 0) / olderModularity.length;

        const trend_direction = avgRecent > avgOlder ? 'fragmenting' : 'consolidating';
        const trend_strength = Math.abs(avgRecent - avgOlder) / avgOlder;

        results = {
          time_series: trends,
          analysis: {
            trend_direction,
            trend_strength: trend_strength * 100,
            current_modularity: trends[trends.length - 1].modularity,
            current_community_count: trends[trends.length - 1].communityCount,
            current_consolidation_index: trends[trends.length - 1].consolidationIndex,
            interpretation: interpretConsolidationTrend(trend_direction, trend_strength),
            strategic_implications: generateStrategicImplications(trend_direction, trend_strength, trends)
          }
        };
        break;
      }

      case 'similarity_analysis': {
        const { node1, node2 } = options;

        if (!node1 || !node2) {
          return NextResponse.json({
            success: false,
            error: 'node1 and node2 required for similarity analysis',
          }, { status: 400 });
        }

        const jaccard = CommunityDetection.jaccardSimilarity(node1, node2, network);
        const cosine = CommunityDetection.cosineSimilarity(node1, node2, network);

        results = {
          node1,
          node2,
          similarity_scores: {
            jaccard,
            cosine,
            average: (jaccard + cosine) / 2
          },
          interpretation: interpretSimilarity(jaccard, cosine),
          partnership_potential: jaccard > 0.3 ? 'high' : jaccard > 0.15 ? 'medium' : 'low',
          competitive_threat: jaccard > 0.5 ? 'direct_competitor' : jaccard > 0.3 ? 'potential_competitor' : 'different_market'
        };
        break;
      }

      case 'comprehensive_analysis': {
        const comprehensive = analyzeMiningCommunities(network);
        const marketStructure = CommunityDetection.analyzeMarketStructure(network);

        results = {
          community_detection: {
            louvain: {
              ...comprehensive.louvain,
              communities_map: Object.fromEntries(comprehensive.louvain.communities)
            },
            label_propagation: {
              ...comprehensive.labelProp,
              communities_map: Object.fromEntries(comprehensive.labelProp.communities)
            },
            agreement_score: calculateAgreement(
              comprehensive.louvain.communities,
              comprehensive.labelProp.communities
            )
          },
          market_structure: marketStructure,
          strategic_recommendations: comprehensive.recommendations,
          key_insights: generateKeyInsights(comprehensive, marketStructure)
        };
        break;
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown analysis type: ${analysis_type}. Valid types: community_detection, market_structure, consolidation_tracking, similarity_analysis, comprehensive_analysis`,
        }, { status: 400 });
    }

    const computationTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      analysis_type,
      results,
      metadata: {
        node_count: network.nodes.length,
        edge_count: network.edges.length,
        computation_time_ms: computationTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Market structure analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET /api/mining/market-structure
 *
 * Get available analysis types and algorithms
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    available_analyses: [
      {
        type: 'community_detection',
        description: 'Detect communities using various algorithms',
        algorithms: ['louvain', 'girvan_newman', 'label_propagation', 'hierarchical', 'all'],
        best_for: 'Identifying regional clusters, partnership networks, competitive groups'
      },
      {
        type: 'market_structure',
        description: 'Analyze overall market structure and concentration',
        metrics: ['modularity', 'HHI', 'community_count', 'dominant_players'],
        best_for: 'Strategic planning, M&A analysis, competitive intelligence'
      },
      {
        type: 'consolidation_tracking',
        description: 'Track market consolidation trends over time',
        requires: 'historical_networks array',
        best_for: 'Trend analysis, regulatory risk assessment, timing strategies'
      },
      {
        type: 'similarity_analysis',
        description: 'Calculate similarity between mining operations',
        metrics: ['jaccard', 'cosine'],
        best_for: 'Partnership opportunities, competitive analysis, M&A targets'
      },
      {
        type: 'comprehensive_analysis',
        description: 'Full analysis combining all methods',
        includes: ['communities', 'market_structure', 'recommendations', 'insights'],
        best_for: 'Initial market assessment, investment decisions'
      }
    ],
    algorithms: {
      louvain: {
        complexity: 'O(n log n)',
        speed: 'Fast',
        best_for: 'Large networks, general-purpose community detection',
        pros: ['Fast', 'Accurate', 'Widely used'],
        cons: ['May merge small communities']
      },
      girvan_newman: {
        complexity: 'O(m²n)',
        speed: 'Slow',
        best_for: 'Hierarchical insights, smaller networks',
        pros: ['Reveals hierarchy', 'Stable results', 'Interpretable'],
        cons: ['Computationally expensive', 'Not suitable for large networks']
      },
      label_propagation: {
        complexity: 'O(m)',
        speed: 'Fastest',
        best_for: 'Very large networks, real-time analysis',
        pros: ['Very fast', 'Near-linear time', 'Scalable'],
        cons: ['Non-deterministic', 'May need multiple runs']
      },
      hierarchical: {
        complexity: 'O(n² log n)',
        speed: 'Medium',
        best_for: 'Understanding hierarchical market structure',
        pros: ['Reveals hierarchy', 'Flexible similarity metrics'],
        cons: ['Slower than Louvain', 'Memory intensive']
      }
    },
    metrics: {
      modularity: {
        range: '[-0.5, 1.0]',
        interpretation: {
          'Q > 0.7': 'Very strong community structure',
          '0.5 < Q ≤ 0.7': 'Strong community structure',
          '0.3 < Q ≤ 0.5': 'Moderate community structure',
          'Q ≤ 0.3': 'Weak or no community structure'
        }
      },
      herfindahl_index: {
        range: '[0, 10000]',
        interpretation: {
          'HHI < 1500': 'Competitive market',
          '1500 ≤ HHI < 2500': 'Moderately concentrated',
          'HHI ≥ 2500': 'Highly concentrated (potential monopoly)'
        },
        regulatory: 'US DOJ uses 2500 as threshold for antitrust concern'
      }
    }
  });
}

// Helper functions

function interpretModularity(modularity: number): string {
  if (modularity > 0.7) return 'Very strong community structure - distinct market segments exist';
  if (modularity > 0.5) return 'Strong community structure - clear regional or commodity-based groups';
  if (modularity > 0.3) return 'Moderate community structure - some clustering but significant integration';
  return 'Weak community structure - highly integrated market';
}

function assessConsolidationRisk(hhi: number): {
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  regulatory_concern: boolean;
} {
  if (hhi >= 2500) {
    return {
      level: 'critical',
      description: 'Highly concentrated market with monopolistic characteristics',
      regulatory_concern: true
    };
  }
  if (hhi >= 1800) {
    return {
      level: 'high',
      description: 'Significant consolidation - approaching antitrust thresholds',
      regulatory_concern: true
    };
  }
  if (hhi >= 1500) {
    return {
      level: 'medium',
      description: 'Moderately concentrated - monitor for further consolidation',
      regulatory_concern: false
    };
  }
  return {
    level: 'low',
    description: 'Competitive market with healthy fragmentation',
    regulatory_concern: false
  };
}

function interpretConsolidationTrend(direction: string, strength: number): string {
  const strengthLabel = strength > 0.2 ? 'rapidly' : strength > 0.1 ? 'steadily' : 'slowly';

  if (direction === 'consolidating') {
    return `Market is ${strengthLabel} consolidating - fewer, larger players emerging`;
  } else {
    return `Market is ${strengthLabel} fragmenting - more diverse competition`;
  }
}

function generateStrategicImplications(
  direction: string,
  strength: number,
  trends: any[]
): string[] {
  const implications: string[] = [];

  if (direction === 'consolidating') {
    implications.push('M&A activity likely to continue - position for consolidation or be acquired');
    if (strength > 0.15) {
      implications.push('Rapid consolidation creates urgency for strategic positioning');
    }
    implications.push('Smaller independent operators face increasing competitive pressure');
    implications.push('Regulatory scrutiny may increase as market concentrates');
  } else {
    implications.push('Market fragmentation creates acquisition opportunities');
    implications.push('New entrants finding success - innovation may be disrupting incumbents');
    implications.push('Regional specialization strategies may be effective');
  }

  const latestConsolidationIndex = trends[trends.length - 1].consolidationIndex;
  if (latestConsolidationIndex > 3.0) {
    implications.push('Dominant player(s) control disproportionate market share');
  }

  return implications;
}

function interpretSimilarity(jaccard: number, cosine: number): string {
  const avg = (jaccard + cosine) / 2;

  if (avg > 0.7) return 'Very high similarity - likely direct competitors or partners';
  if (avg > 0.5) return 'High similarity - significant overlap in networks';
  if (avg > 0.3) return 'Moderate similarity - some shared connections';
  if (avg > 0.15) return 'Low similarity - different networks but some overlap';
  return 'Very low similarity - operate in different spheres';
}

function calculateAgreement(comm1: Map<string, number>, comm2: Map<string, number>): number {
  let agreements = 0;
  const total = comm1.size;

  comm1.forEach((c1, node1) => {
    comm1.forEach((c1_other, node2) => {
      if (node1 < node2) {
        const sameCommunityInComm1 = c1 === c1_other;
        const sameCommunityInComm2 = comm2.get(node1) === comm2.get(node2);

        if (sameCommunityInComm1 === sameCommunityInComm2) {
          agreements++;
        }
      }
    });
  });

  const maxPairs = (total * (total - 1)) / 2;
  return agreements / maxPairs;
}

function generateKeyInsights(comprehensive: any, marketStructure: any): string[] {
  const insights: string[] = [];

  // Modularity insights
  if (comprehensive.louvain.modularity > 0.6) {
    insights.push(`Strong regional/commodity clustering (modularity: ${comprehensive.louvain.modularity.toFixed(2)})`);
  }

  // Market concentration insights
  if (marketStructure.herfindahl_index > 2500) {
    insights.push(`Market highly concentrated - HHI of ${marketStructure.herfindahl_index.toFixed(0)} indicates monopolistic tendencies`);
  }

  // Community count insights
  if (comprehensive.louvain.communityCount < 3) {
    insights.push(`Only ${comprehensive.louvain.communityCount} major market segments - limited diversity`);
  }

  // Algorithm agreement insights
  const agreement = calculateAgreement(comprehensive.louvain.communities, comprehensive.labelProp.communities);
  if (agreement < 0.7) {
    insights.push('Different algorithms identify different structures - market may be in transition');
  }

  // Dominant player insights
  if (marketStructure.dominant_players.length > 0) {
    const topPlayer = marketStructure.dominant_players[0];
    insights.push(`${topPlayer.nodeId} is dominant player with ${(topPlayer.market_share * 100).toFixed(1)}% market share`);
  }

  return insights;
}
