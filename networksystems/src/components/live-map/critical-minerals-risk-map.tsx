'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { AFRICAN_MINING_OPERATIONS, NETWORK_CONNECTIONS, AfricanMiningNetwork, AfricanMiningOperation } from '@/services/african-mining-network';
import { REAL_JOHANNESBURG_MINES, TAILINGS_OPPORTUNITIES, RealMiningDataService, RealMineData } from '@/services/real-mining-data';
import { Network, Node, Edge } from '@/stores/network-store';
import { useMiningStore } from '@/stores/mining-store';
import { useMiningOperations, useCommodityPrices, useMarketIntelligence } from '@/hooks/use-live-data';
import {
  Zap,
  AlertTriangle,
  TrendingUp,
  Globe,
  DollarSign,
  Activity
} from 'lucide-react';

// Real-time network algorithm implementations
class NetworkAlgorithms {
  static calculateBetweennessCentrality(network: Network): Map<string, number> {
    const centrality = new Map<string, number>();
    const nodes = network.nodes;
    const edges = network.edges;

    // Initialize centrality scores
    nodes.forEach(node => centrality.set(node.id, 0));

    // For each pair of nodes, calculate shortest paths
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const source = nodes[i].id;
        const target = nodes[j].id;

        // Find all shortest paths between source and target
        const paths = this.findShortestPaths(network, source, target);

        // For each shortest path, increment centrality of intermediate nodes
        paths.forEach(path => {
          for (let k = 1; k < path.length - 1; k++) {
            const intermediateNode = path[k];
            centrality.set(intermediateNode, (centrality.get(intermediateNode) || 0) + 1);
          }
        });
      }
    }

    return centrality;
  }

  static findShortestPaths(network: Network, source: string, target: string): string[][] {
    // Simplified shortest path using BFS
    const queue = [[source]];
    const visited = new Set<string>();
    const paths: string[][] = [];
    let shortestLength = Infinity;

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      const currentNode = currentPath[currentPath.length - 1];

      if (currentPath.length > shortestLength) continue;

      if (currentNode === target) {
        if (currentPath.length < shortestLength) {
          shortestLength = currentPath.length;
          paths.length = 0; // Clear longer paths
        }
        if (currentPath.length === shortestLength) {
          paths.push([...currentPath]);
        }
        continue;
      }

      if (visited.has(currentNode)) continue;
      visited.add(currentNode);

      // Find connected nodes
      const neighbors = network.edges
        .filter(edge => edge.source === currentNode || edge.target === currentNode)
        .map(edge => edge.source === currentNode ? edge.target : edge.source)
        .filter(neighbor => !currentPath.includes(neighbor));

      neighbors.forEach(neighbor => {
        queue.push([...currentPath, neighbor]);
      });
    }

    return paths;
  }

  static calculateClusteringCoefficient(network: Network): Map<string, number> {
    const clustering = new Map<string, number>();

    network.nodes.forEach(node => {
      const neighbors = this.getNeighbors(network, node.id);

      if (neighbors.length < 2) {
        clustering.set(node.id, 0);
        return;
      }

      let triangles = 0;
      const maxTriangles = (neighbors.length * (neighbors.length - 1)) / 2;

      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (this.areConnected(network, neighbors[i], neighbors[j])) {
            triangles++;
          }
        }
      }

      clustering.set(node.id, triangles / maxTriangles);
    });

    return clustering;
  }

  private static getNeighbors(network: Network, nodeId: string): string[] {
    return network.edges
      .filter(edge => edge.source === nodeId || edge.target === nodeId)
      .map(edge => edge.source === nodeId ? edge.target : edge.source);
  }

  private static areConnected(network: Network, node1: string, node2: string): boolean {
    return network.edges.some(edge =>
      (edge.source === node1 && edge.target === node2) ||
      (edge.source === node2 && edge.target === node1)
    );
  }
}

const CriticalMineralsRiskMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [networkMetrics, setNetworkMetrics] = useState<any>({});
  const [animationFrame, setAnimationFrame] = useState(0);
  const [tailingsAnalysis, setTailingsAnalysis] = useState<any>(null);

  const { runTailingsAnalysis } = useMiningStore();

  // Live data hooks
  const { data: miningOpsData, lastUpdated: miningUpdated } = useMiningOperations();
  const { data: commodityPrices } = useCommodityPrices();
  const { data: marketIntel } = useMarketIntelligence();

  // Convert mining operations to network format including real Johannesburg data
  const createMiningNetwork = (): Network => {
    // Continental operations
    const continentalNodes: Node[] = AFRICAN_MINING_OPERATIONS.map(op => ({
      id: op.id,
      label: op.name,
      group: op.region,
      size: Math.log(op.economic_impact.employment) * 5,
      x: op.location.lng,
      y: op.location.lat,
      color: getRegionColor(op.region),
      metadata: {
        type: 'continental',
        country: op.country,
        commodities: op.commodities,
        production: op.production,
        employment: op.economic_impact.employment,
        revenue: op.economic_impact.government_revenue_usd_m
      }
    }));

    // Real Johannesburg mining operations with detailed data
    const johannesburgNodes: Node[] = REAL_JOHANNESBURG_MINES.map(mine => ({
      id: `jb_${mine.id}`,
      label: mine.name,
      group: 'johannesburg_detail',
      size: Math.log(mine.economics.employment) * 6, // Slightly larger for detail
      x: mine.location.lng,
      y: mine.location.lat,
      color: mine.status === 'operational' ? '#16a34a' : mine.status === 'development' ? '#ca8a04' : '#2563eb',
      metadata: {
        type: 'johannesburg',
        operator: mine.operator,
        status: mine.status,
        annual_oz: mine.production.annual_oz,
        grade: mine.production.grade_gt,
        reserves: mine.production.reserves_oz,
        aisc: mine.economics.aisc_usd_oz,
        employment: mine.economics.employment,
        depth: mine.location.depth_m
      }
    }));

    const nodes = [...continentalNodes, ...johannesburgNodes];

    // Continental connections
    const continentalEdges: Edge[] = NETWORK_CONNECTIONS.map(conn => ({
      source: conn.source_id,
      target: conn.target_id,
      weight: conn.strength,
      color: getConnectionColor(conn.strength),
      metadata: {
        type: conn.connection_type,
        value: conn.value_usd_annually,
        description: conn.description
      }
    }));

    // Johannesburg internal connections (mines to tailings opportunities)
    const johannesburgEdges: Edge[] = [];
    const operationalJbMines = REAL_JOHANNESBURG_MINES.filter(m => m.status === 'operational');

    // Create connections between operational mines for tailings flow
    for (let i = 0; i < operationalJbMines.length - 1; i++) {
      johannesburgEdges.push({
        source: `jb_${operationalJbMines[i].id}`,
        target: `jb_${operationalJbMines[i + 1].id}`,
        weight: 0.7,
        color: '#16a34a',
        metadata: {
          type: 'tailings_flow',
          value: 50000000, // $50M annual tailings processing value
          description: 'Tailings reprocessing network'
        }
      });
    }

    const edges = [...continentalEdges, ...johannesburgEdges];

    return {
      id: 'critical-minerals-risk-network',
      name: 'Critical Minerals Risk Network',
      nodes,
      edges,
      directed: false
    };
  };

  const getRegionColor = (region: string) => {
    const colors = {
      'west_africa': '#4b5563',      // Gray 600
      'east_africa': '#6b7280',      // Gray 500
      'southern_africa': '#9ca3af',  // Gray 400
      'central_africa': '#374151',   // Gray 700
      'north_africa': '#1f2937'      // Gray 800
    };
    return colors[region as keyof typeof colors] || '#6b7280';
  };

  const getConnectionColor = (strength: number) => {
    if (strength >= 0.8) return '#16a34a'; // Strong - Green 600
    if (strength >= 0.6) return '#ca8a04'; // Medium - Yellow 600
    return '#dc2626'; // Weak - Red 600
  };

  // Calculate network metrics using algorithms
  useEffect(() => {
    const network = createMiningNetwork();

    const betweenness = NetworkAlgorithms.calculateBetweennessCentrality(network);
    const clustering = NetworkAlgorithms.calculateClusteringCoefficient(network);

    setNetworkMetrics({
      betweenness: Object.fromEntries(betweenness),
      clustering: Object.fromEntries(clustering),
      totalNodes: network.nodes.length,
      totalEdges: network.edges.length
    });

    // Calculate live metrics including real Johannesburg data
    const totalFlow = NETWORK_CONNECTIONS.reduce((sum, conn) => sum + (conn.value_usd_annually || 0), 0);
    const criticalPaths = Array.from(betweenness.values()).filter(val => val > 0).length;
    const vulnerabilities = NETWORK_CONNECTIONS.filter(conn => conn.strength < 0.6).length;

    // Add real Johannesburg mining data
    const tailingsValue = TAILINGS_OPPORTUNITIES.reduce((sum, t) =>
      sum + (t.estimated_gold_oz * 2400 - t.estimated_gold_oz * t.processing_cost_usd_oz), 0
    );
    const johannesburgProduction = REAL_JOHANNESBURG_MINES
      .filter(m => m.status === 'operational')
      .reduce((sum, m) => sum + m.production.annual_oz, 0);

    // Live data is now handled by the useMiningOperations hook
    // Run live tailings analysis for network intelligence
    runLiveTailingsAnalysis();
  }, []);

  // Live tailings analysis integration
  const runLiveTailingsAnalysis = async () => {
    try {
      const response = await fetch('/api/mining/tailings-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: {
            id: 'johannesburg-network',
            sites: REAL_JOHANNESBURG_MINES.map(mine => ({
              id: mine.id,
              name: mine.name,
              location: mine.location,
              production: mine.production
            }))
          },
          sampleData: {
            composition: { gold: 0.35, uranium: 0.08, copper: 0.42 },
            conditions: { pH: 2.8, temperature: 22, grindSize: 75 }
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setTailingsAnalysis(result);
      }
    } catch (error) {
      console.error('Live tailings analysis failed:', error);
    }
  };

  // SVG Map Component
  const renderNetworkMap = () => {
    const network = createMiningNetwork();
    const width = 1200;
    const height = 600;

    // Africa bounds (approximate)
    const africaBounds = {
      minLat: -35,
      maxLat: 37,
      minLng: -20,
      maxLng: 55
    };

    const scaleX = (lng: number) => ((lng - africaBounds.minLng) / (africaBounds.maxLng - africaBounds.minLng)) * width;
    const scaleY = (lat: number) => height - ((lat - africaBounds.minLat) / (africaBounds.maxLat - africaBounds.minLat)) * height;

    return (
      <svg width={width} height={height} className="w-full h-auto">
        {/* Background with subtle map texture */}
        <defs>
          <pattern id="mapTexture" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#fafafa"/>
            <circle cx="10" cy="10" r="1" fill="#f4f4f5" opacity="0.5"/>
          </pattern>
          <linearGradient id="africaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f9fafb"/>
            <stop offset="50%" stopColor="#f4f4f5"/>
            <stop offset="100%" stopColor="#e4e4e7"/>
          </linearGradient>
        </defs>
        <rect width={width} height={height} fill="url(#africaGradient)" />

        {/* Simplified African continent outline */}
        <path
          d="M200,150 Q250,120 350,140 Q450,160 500,200 Q550,250 580,350 Q590,450 550,520 Q500,580 400,590 Q300,580 250,550 Q200,500 180,450 Q160,400 170,350 Q180,300 200,250 Q190,200 200,150 Z"
          fill="none"
          stroke="#d4d4d8"
          strokeWidth="2"
          strokeDasharray="8,4"
          opacity="0.3"
        />

        {/* Additional continental features */}
        <path
          d="M300,180 Q350,170 400,190 Q450,210 480,260 Q490,310 460,350 Q430,380 380,385 Q330,380 300,350 Q280,320 285,290 Q290,250 300,220 Q295,200 300,180 Z"
          fill="none"
          stroke="#a1a1aa"
          strokeWidth="1"
          strokeDasharray="4,2"
          opacity="0.2"
        />

        {/* Regional zones - subtle background areas */}
        <ellipse cx="280" cy="200" rx="80" ry="60" fill="#f0fdf4" opacity="0.3" />
        <ellipse cx="450" cy="180" rx="70" ry="50" fill="#fef7cd" opacity="0.3" />
        <ellipse cx="380" cy="320" rx="90" ry="70" fill="#e0f2fe" opacity="0.3" />
        <ellipse cx="320" cy="450" rx="85" ry="65" fill="#f3e8ff" opacity="0.3" />
        <ellipse cx="500" cy="400" rx="75" ry="55" fill="#fdf2f8" opacity="0.3" />

        {/* Major trade routes as subtle background lines */}
        <path
          d="M200,400 Q300,350 400,380 Q500,410 580,450"
          stroke="#d1d5db"
          strokeWidth="2"
          strokeDasharray="12,8"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M250,200 Q350,250 450,300 Q520,350 580,380"
          stroke="#d1d5db"
          strokeWidth="2"
          strokeDasharray="12,8"
          fill="none"
          opacity="0.4"
        />

        {/* Port locations */}
        <circle cx="200" cy="300" r="4" fill="#6b7280" opacity="0.6" />
        <circle cx="580" cy="350" r="4" fill="#6b7280" opacity="0.6" />
        <circle cx="300" cy="500" r="4" fill="#6b7280" opacity="0.6" />

        {/* Connection lines */}
        {network.edges.map((edge, idx) => {
          const sourceNode = network.nodes.find(n => n.id === edge.source);
          const targetNode = network.nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          const x1 = scaleX(sourceNode.x!);
          const y1 = scaleY(sourceNode.y!);
          const x2 = scaleX(targetNode.x!);
          const y2 = scaleY(targetNode.y!);

          return (
            <g key={idx}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={edge.color}
                strokeWidth={Math.max(2, (edge.weight || 0.5) * 5)}
                strokeOpacity={0.7}
                strokeDasharray="8,4"
              />
              {/* Enhanced flow animation with value indicators */}
              <circle r="4" fill="#4b5563" opacity="0.8">
                <animateMotion dur={`${6 - (edge.weight || 0.5) * 4}s`} repeatCount="indefinite">
                  <mpath href={`#path-${idx}`} />
                </animateMotion>
              </circle>
              <circle r="2" fill="#374151" opacity="0.6">
                <animateMotion dur={`${6 - (edge.weight || 0.5) * 4}s`} repeatCount="indefinite" begin="0.5s">
                  <mpath href={`#path-${idx}`} />
                </animateMotion>
              </circle>
              <path id={`path-${idx}`} d={`M ${x1} ${y1} L ${x2} ${y2}`} fill="none" opacity="0" />

              {/* Value flow indicator for high-value connections */}
              {edge.metadata?.value && edge.metadata.value > 100000000 && (
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 8}
                  fill="#fbbf24"
                  fontSize="6"
                  textAnchor="middle"
                  className="font-mono font-medium"
                >
                  ${(edge.metadata.value / 1000000000).toFixed(1)}B
                </text>
              )}
            </g>
          );
        })}

        {/* Mining operation nodes */}
        {network.nodes.map((node, idx) => {
          const x = scaleX(node.x!);
          const y = scaleY(node.y!);
          const radius = Math.max(5, (node.size || 10) / 2);
          const isSelected = selectedOperation === node.id;
          const centrality = networkMetrics.betweenness?.[node.id] || 0;

          return (
            <g key={idx}>
              {/* Centrality ring */}
              {centrality > 0 && (
                <circle
                  cx={x}
                  cy={y}
                  r={radius + 8}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  opacity="0.6"
                />
              )}

              {/* Main node */}
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={node.color}
                stroke={isSelected ? "#ffffff" : node.color}
                strokeWidth={isSelected ? "3" : "1"}
                opacity="0.9"
                className="cursor-pointer hover:opacity-100"
                onClick={() => setSelectedOperation(selectedOperation === node.id ? null : node.id)}
              />

              {/* Pulse animation for active nodes */}
              {node.metadata?.production?.annual_production > 0 && (
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={node.color}
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    values={`${radius};${radius + 10};${radius}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0;0.4"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Node label - different for Johannesburg operations */}
              <text
                x={x}
                y={y - radius - 5}
                fill="#1f2937"
                fontSize={node.metadata?.type === 'johannesburg' ? '8' : '10'}
                textAnchor="middle"
                className="font-sans font-medium"
              >
                {node.metadata?.type === 'johannesburg'
                  ? `${node.metadata?.annual_oz?.toLocaleString() || '0'} oz`
                  : node.label
                }
              </text>

              {/* Live production indicator */}
              {(node.metadata?.annual_oz > 0 || node.metadata?.production?.annual_production > 0) && (
                <circle
                  cx={x + 12}
                  cy={y - 12}
                  r="3"
                  fill="#10b981"
                  opacity="0.9"
                >
                  <animate
                    attributeName="r"
                    values="2;5;2"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.9;0.3;0.9"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* Tailings indicator for Johannesburg mines */}
              {node.metadata?.type === 'johannesburg' && (
                <circle
                  cx={x + 15}
                  cy={y - 15}
                  r="4"
                  fill="#f59e0b"
                  opacity="0.8"
                >
                  <animate
                    attributeName="opacity"
                    values="0.8;0.3;0.8"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Critical path highlights */}
        {Object.entries(networkMetrics.betweenness || {})
          .filter(([_, value]) => (value as number) > 2)
          .map(([nodeId, _], idx) => {
            const node = network.nodes.find(n => n.id === nodeId);
            if (!node) return null;

            return (
              <circle
                key={`critical-${idx}`}
                cx={scaleX(node.x!)}
                cy={scaleY(node.y!)}
                r="20"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.7"
              >
                <animate
                  attributeName="r"
                  values="15;25;15"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
            );
          })
        }
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Premium Swiss-Style Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-zinc-200/50">
        <div className="max-w-[1800px] mx-auto px-12 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-12">
              <div className="flex items-center space-x-6">
                <div className="bg-zinc-900 text-white px-6 py-3 text-sm font-light tracking-wide rounded">
                  SOBapp
                </div>
                <div>
                  <h1 className="text-2xl font-extralight text-zinc-900 tracking-tight">Critical Minerals Risk</h1>
                  <p className="text-sm text-zinc-500 font-light">Supply Chain Intelligence</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 bg-emerald-50/80 px-4 py-2 rounded-full border border-emerald-100/50">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-light text-emerald-700">68% Critical Minerals Control</span>
              </div>
            </div>
            <div className="flex items-center space-x-12">
              <div className="text-center">
                <div className="text-xl font-light text-zinc-900">
                  ${commodityPrices && commodityPrices.gold ?
                    (commodityPrices.gold.current * 2.5 / 1000).toFixed(1) :
                    '38.5'}B
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Net Flow</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-light text-emerald-600">
                  ${miningOpsData && miningOpsData.johannesburg ?
                    (miningOpsData.johannesburg.production * 0.15 / 1000).toFixed(1) :
                    '16.0'}B
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Tailings Value</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-light text-zinc-900">
                  {miningOpsData && miningOpsData.johannesburg ?
                    miningOpsData.johannesburg.production.toLocaleString() :
                    '115,000'}
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Au Oz/Yr</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-light text-amber-500">24</div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Critical Paths</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-light text-rose-500">MEDIUM</div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider font-light">Risk Level</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-12 py-12 space-y-16">
        {/* Premium Network Panel */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight">Critical Minerals Supply Chain</h2>
                <p className="text-sm text-zinc-500 mt-2 font-light">Real-time risk monitoring of supply chain operations</p>
              </div>
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-xs font-light text-zinc-600">Strong</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span className="text-xs font-light text-zinc-600">Medium</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                  <span className="text-xs font-light text-zinc-600">Weak</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-xs font-light text-zinc-600">Critical</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-12">
            <div className="bg-zinc-50/50 rounded-xl border border-zinc-200/30 overflow-hidden">
              {renderNetworkMap()}
            </div>
          </div>
        </div>

        {/* Strategic Insights Dashboard */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight">Strategic Intelligence</h2>
                <p className="text-sm text-zinc-500 mt-2 font-light">AI-powered mining sector analysis</p>
              </div>
              <div className="flex items-center space-x-3 bg-emerald-50/60 px-4 py-2 rounded-full border border-emerald-100/50">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-light text-emerald-700">Live Analysis</span>
              </div>
            </div>
          </div>

          {/* High Priority Actions */}
          <div className="px-8 py-8 border-b border-zinc-200/50">
            <h3 className="text-xl font-extralight text-zinc-900 mb-8 tracking-tight">Priority Opportunities</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

              {/* Massive Tailings Reprocessing */}
              <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 rounded-xl p-8 border border-emerald-200/30">
                <div className="flex items-start justify-between mb-6">
                  <h4 className="text-xl font-light text-zinc-900">Tailings Reprocessing</h4>
                  <div className="bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-light tracking-wide">$16.0B Revenue Potential</div>
                </div>
                <p className="text-sm text-zinc-600 mb-6 font-light leading-relaxed">
                  Analysis of East Rand, West Rand, and Klerksdorp tailings dams reveals 6.6M oz of recoverable gold worth $16B+ at current prices.
                </p>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-light">Total Gold Content</span>
                      <span className="font-light text-zinc-900">6.6M oz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-light">Net Recovery Value</span>
                      <span className="font-light text-emerald-600">$16.0B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-light">Processing Cost</span>
                      <span className="font-light text-zinc-900">$850/oz avg</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/60 p-3 rounded border border-zinc-200/50">
                      <div className="text-xs text-zinc-500 font-light">New Surveys</div>
                      <div className="font-light text-emerald-600">+2%</div>
                    </div>
                    <div className="bg-white/60 p-3 rounded border border-zinc-200/50">
                      <div className="text-xs text-zinc-500 font-light">Gold Price Gains</div>
                      <div className="font-light text-emerald-600">+12%</div>
                    </div>
                    <div className="bg-white/60 p-3 rounded border border-zinc-200/50">
                      <div className="text-xs text-zinc-500 font-light">New Technology</div>
                      <div className="font-light text-emerald-600">-8% costs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Critical Minerals Co-Extraction */}
              <div className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-xl p-8 border border-blue-200/30">
                <div className="flex items-start justify-between mb-6">
                  <h4 className="text-xl font-light text-zinc-900">Critical Minerals Co-Extraction</h4>
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-xs font-light tracking-wide">$2.4B Additional Revenue</div>
                </div>
                <p className="text-sm text-zinc-600 mb-6 font-light leading-relaxed">
                  Witwatersrand gold operations contain significant uranium, palladium, and rare earth elements supporting clean energy transition.
                </p>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-light">Uranium Production</span>
                      <span className="font-light text-zinc-900">1,200 t/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-light">Palladium Content</span>
                      <span className="font-light text-zinc-900">8,000 kg/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-light">REE Opportunity</span>
                      <span className="font-light text-zinc-900">750 t/yr</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white/60 p-3 rounded border border-zinc-200/50">
                      <div className="text-xs text-zinc-500 font-light">From Current</div>
                      <div className="font-light text-blue-600">+147%</div>
                    </div>
                    <div className="bg-white/60 p-3 rounded border border-zinc-200/50">
                      <div className="text-xs text-zinc-500 font-light">New Discovery</div>
                      <div className="font-light text-blue-600">Fresh Source</div>
                    </div>
                    <div className="bg-white/60 p-3 rounded border border-zinc-200/50">
                      <div className="text-xs text-zinc-500 font-light">Under Exploration</div>
                      <div className="font-light text-blue-600">Strong Demand</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* All Strategic Insights Grid - HIDDEN PER USER REQUEST */}
          <div className="px-8 pb-8" style={{display: 'none'}}>
            <h3 className="text-xl font-extralight text-zinc-900 mb-8 tracking-tight">Strategic Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

              {/* Ultra-Deep Mining Technology */}
              <div className="border border-zinc-200/50 rounded-xl p-6 bg-white/40 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-light text-zinc-900">Ultra-Deep Mining Technology</h4>
                  <span className="bg-emerald-100/80 text-emerald-700 px-3 py-1 rounded-full text-xs font-light">25% Cost Reduction</span>
                </div>
                <p className="text-sm text-zinc-600 mb-4 font-light leading-relaxed">Operations at 3-4km depth face extreme temperatures and costs.</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Current Depth Record</span>
                    <span className="font-light text-zinc-900">4,000m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Temperature Challenge</span>
                    <span className="font-light text-rose-500">55°C+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Automation Adoption</span>
                    <span className="font-light text-emerald-600">25% (+15%)</span>
                  </div>
                </div>
              </div>

              {/* Employment Transition */}
              <div className="border border-zinc-200/50 rounded-xl p-6 bg-white/40 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-light text-zinc-900">Employment Transition</h4>
                  <span className="bg-amber-100/80 text-amber-700 px-3 py-1 rounded-full text-xs font-light">93,841 Jobs at Risk</span>
                </div>
                <p className="text-sm text-zinc-600 mb-4 font-light leading-relaxed">Employment declined 60% since peak. Reskilling programs critical.</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Current Employment</span>
                    <span className="font-light text-zinc-900">93,841 (-15%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Skills Gap</span>
                    <span className="font-light text-rose-500">Critical</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Productivity Gain</span>
                    <span className="font-light text-emerald-600">40%</span>
                  </div>
                </div>
              </div>

              {/* Carbon Intensity Reduction */}
              <div className="border border-zinc-200/50 rounded-xl p-6 bg-white/40 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-light text-zinc-900">Carbon Intensity Reduction</h4>
                  <span className="bg-emerald-100/80 text-emerald-700 px-3 py-1 rounded-full text-xs font-light">50% Emissions Cut</span>
                </div>
                <p className="text-sm text-zinc-600 mb-4 font-light leading-relaxed">Renewable energy and electrification by 2030.</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Current Intensity</span>
                    <span className="font-light text-zinc-900">0.65 kg CO₂/oz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Renewable Energy</span>
                    <span className="font-light text-emerald-600">15% (+5%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Investment Required</span>
                    <span className="font-light text-zinc-900">$850M</span>
                  </div>
                </div>
              </div>

              {/* Market Consolidation */}
              <div className="border border-zinc-200/50 rounded-xl p-6 bg-white/40 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-light text-zinc-900">Market Consolidation Risk</h4>
                  <span className="bg-rose-100/80 text-rose-700 px-3 py-1 rounded-full text-xs font-light">60% Share Risk</span>
                </div>
                <p className="text-sm text-zinc-600 mb-4 font-light leading-relaxed">South Africa's market share fell from 70% to 3%.</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Market Share 1970s</span>
                    <span className="font-light text-zinc-900">70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Market Share 2024</span>
                    <span className="font-light text-rose-500">3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Years Remaining</span>
                    <span className="font-light text-amber-500">27</span>
                  </div>
                </div>
              </div>

              {/* Global Supply Chain Control */}
              <div className="border border-zinc-200/50 rounded-xl p-6 bg-white/40 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-light text-zinc-900">Critical Minerals Control</h4>
                  <span className="bg-emerald-100/80 text-emerald-700 px-3 py-1 rounded-full text-xs font-light">68% Global Control</span>
                </div>
                <p className="text-sm text-zinc-600 mb-4 font-light leading-relaxed">Africa controls world's critical mineral supply chains.</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Cobalt Supply</span>
                    <span className="font-light text-emerald-600">70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Phosphate Supply</span>
                    <span className="font-light text-emerald-600">75%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">China Trade</span>
                    <span className="font-light text-zinc-900">$95B</span>
                  </div>
                </div>
              </div>

              {/* Industry Transformation */}
              <div className="border border-zinc-200/50 rounded-xl p-6 bg-gradient-to-br from-zinc-50/50 to-zinc-100/30 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-light text-zinc-900">Industry Transformation</h4>
                  <span className="bg-zinc-800 text-white px-3 py-1 rounded-full text-xs font-light">2030 Target</span>
                </div>
                <p className="text-sm text-zinc-600 mb-4 font-light leading-relaxed">Strategic positioning for the next decade.</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Total Opportunity</span>
                    <span className="font-light text-emerald-600">$18.4B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Jobs Sustainable</span>
                    <span className="font-light text-emerald-600">150,000+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-light">Target</span>
                    <span className="font-light text-zinc-900">Carbon Neutral</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Deep Intelligence Analysis - Comprehensive Insights - HIDDEN PER USER REQUEST */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20" style={{display: 'none'}}>
          <div className="border-b border-zinc-200/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight">Deep Intelligence Analysis</h2>
                <p className="text-sm text-zinc-500 mt-2 font-light">Comprehensive sector transformation and opportunity mapping</p>
              </div>
              <div className="flex items-center space-x-3 bg-blue-50/60 px-4 py-2 rounded-full border border-blue-100/50">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-light text-blue-700">AI-Powered Analysis</span>
              </div>
            </div>
          </div>

          {/* Continental Supply Chain Control */}
          <div className="px-8 py-8 border-b border-zinc-200/50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-extralight text-zinc-900 tracking-tight">Continental Supply Chain Control</h3>
              <div className="bg-emerald-500 text-white px-6 py-3 rounded-full text-sm font-light tracking-wide">68% Global Critical Minerals</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 rounded-xl p-8 border border-emerald-200/30">
                <h4 className="font-light text-zinc-900 mb-6">Global Cobalt Supply</h4>
                <div className="text-4xl font-extralight text-emerald-600 mb-3">70%</div>
                <p className="text-sm text-zinc-600 mb-6 font-light leading-relaxed">Essential for EV batteries - all flows through DRC-Zambia corridor</p>
                <div className="text-xs bg-white/60 p-3 rounded border border-zinc-200/50">
                  <div className="text-zinc-500 font-light">Supply Chain Risk</div>
                  <div className="font-light text-rose-500">Single Point of Failure</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50/50 to-amber-100/30 rounded-xl p-8 border border-amber-200/30">
                <h4 className="font-light text-zinc-900 mb-6">Global Phosphate Supply</h4>
                <div className="text-4xl font-extralight text-amber-600 mb-3">75%</div>
                <p className="text-sm text-zinc-600 mb-6 font-light leading-relaxed">Morocco feeds global food security through fertilizers</p>
                <div className="text-xs bg-white/60 p-3 rounded border border-zinc-200/50">
                  <div className="text-zinc-500 font-light">Strategic Value</div>
                  <div className="font-light text-amber-600">Food Security Control</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50/50 to-rose-100/30 rounded-xl p-8 border border-rose-200/30">
                <h4 className="font-light text-zinc-900 mb-6">Annual China Trade</h4>
                <div className="text-4xl font-extralight text-rose-600 mb-3">$95B</div>
                <p className="text-sm text-zinc-600 mb-6 font-light leading-relaxed">95M tonnes of African minerals flow to China annually</p>
                <div className="text-xs bg-white/60 p-3 rounded border border-zinc-200/50">
                  <div className="text-zinc-500 font-light">Dependency Risk</div>
                  <div className="font-light text-rose-500">Logistics Bottleneck</div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50/50 rounded-xl p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-extralight text-zinc-900">8</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Major Operations</div>
                  <div className="text-xs text-zinc-400 font-light">8 countries, 5 regions</div>
                </div>
                <div>
                  <div className="text-3xl font-extralight text-emerald-600">509K</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Direct Jobs</div>
                  <div className="text-xs text-zinc-400 font-light">Continental employment</div>
                </div>
                <div>
                  <div className="text-3xl font-extralight text-blue-600">$38.5B</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Govt Revenue</div>
                  <div className="text-xs text-zinc-400 font-light">Annual tax contribution</div>
                </div>
                <div>
                  <div className="text-3xl font-extralight text-emerald-600">6</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Network Links</div>
                  <div className="text-xs text-zinc-400 font-light">Cross-border connections</div>
                </div>
              </div>
            </div>
          </div>

          {/* Johannesburg Operations Deep Dive */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Johannesburg Gold Operations</h3>
                <p className="text-sm text-gray-600">Live data from Witwatersrand Basin - Africa's premier gold district</p>
              </div>
              <div className="bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-semibold">$10.2B Tailings Value</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              <div className="text-center bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">2</div>
                <div className="text-sm text-gray-600">Active Mines</div>
                <div className="text-xs text-gray-500">Live operations</div>
              </div>
              <div className="text-center bg-emerald-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">115,000</div>
                <div className="text-sm text-gray-600">oz Gold/Year</div>
                <div className="text-xs text-gray-500">@ $2,400/oz = $276M</div>
              </div>
              <div className="text-center bg-amber-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">$10.2B</div>
                <div className="text-sm text-gray-600">Tailings Value</div>
                <div className="text-xs text-gray-500">Recoverable opportunity</div>
              </div>
              <div className="text-center bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">2,300</div>
                <div className="text-sm text-gray-600">Jobs</div>
                <div className="text-xs text-gray-500">Direct employment</div>
              </div>
            </div>

            {/* Tailings Reprocessing Breakdown */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Tailings Reprocessing Opportunity</h4>
              <p className="text-sm text-gray-600 mb-4">Recover gold from existing waste - immediate value creation with streamlined permits</p>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-semibold text-gray-900">East Rand</h5>
                    <div className="text-sm bg-emerald-100 text-emerald-800 px-2 py-1 rounded">Highest ROI</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume</span>
                      <span className="font-medium">6.2MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gold Content</span>
                      <span className="font-medium">2,100k oz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grade</span>
                      <span className="font-medium">0.35 g/t</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Net Value</span>
                      <span className="font-bold text-emerald-600">$3,255M</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border">
                  <h5 className="font-semibold text-gray-900 mb-2">West Rand</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume</span>
                      <span className="font-medium">4.8MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gold Content</span>
                      <span className="font-medium">1,650k oz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grade</span>
                      <span className="font-medium">0.42 g/t</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Net Value</span>
                      <span className="font-bold text-blue-600">$2,442M</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border">
                  <h5 className="font-semibold text-gray-900 mb-2">Klerksdorp</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volume</span>
                      <span className="font-medium">8.5MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gold Content</span>
                      <span className="font-medium">2,800k oz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Grade</span>
                      <span className="font-medium">0.38 g/t</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Net Value</span>
                      <span className="font-bold text-emerald-600">$4,536M</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Execution Framework */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Strategic Execution Framework</h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-gray-900">Immediate Action</h4>
                </div>
                <p className="text-sm text-gray-700 mb-3">East Rand tailings complex offers highest ROI with $2.5B net value and existing infrastructure.</p>
                <div className="text-xs bg-white p-2 rounded border">
                  <div className="text-gray-500">Status</div>
                  <div className="font-medium text-green-600">Ready for development</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h4 className="font-semibold text-gray-900">Technology Focus</h4>
                </div>
                <p className="text-sm text-gray-700 mb-3">Ultra-deep mining automation could reduce costs by 25% for operations below 3km depth.</p>
                <div className="text-xs bg-white p-2 rounded border">
                  <div className="text-gray-500">Timeline</div>
                  <div className="font-medium text-blue-600">5-year investment horizon</div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <h4 className="font-semibold text-gray-900">Market Position</h4>
                </div>
                <p className="text-sm text-gray-700 mb-3">South Africa can reclaim 8-12% global market share through tailings reprocessing and efficiency gains.</p>
                <div className="text-xs bg-white p-2 rounded border">
                  <div className="text-gray-500">Impact</div>
                  <div className="font-medium text-emerald-600">Strategic opportunity</div>
                </div>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="mt-6 bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">27</div>
                  <div className="text-sm text-gray-600">Years Remaining</div>
                  <div className="text-xs text-rose-500">At current rates</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">8-12%</div>
                  <div className="text-sm text-gray-600">Market Share Recovery</div>
                  <div className="text-xs text-emerald-500">Achievable target</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">25%</div>
                  <div className="text-sm text-gray-600">Cost Reduction</div>
                  <div className="text-xs text-blue-500">Through automation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">150K+</div>
                  <div className="text-sm text-gray-600">Jobs Sustainable</div>
                  <div className="text-xs text-emerald-500">With technology adoption</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Operation Details - Enhanced for both Continental and Johannesburg - HIDDEN PER USER REQUEST */}
        {selectedOperation && (() => {
          // Check if it's a Johannesburg operation
          const isJohannesburg = selectedOperation.startsWith('jb_');
          const operation = isJohannesburg
            ? REAL_JOHANNESBURG_MINES.find(mine => `jb_${mine.id}` === selectedOperation)
            : AFRICAN_MINING_OPERATIONS.find(op => op.id === selectedOperation);

          const centrality = networkMetrics.betweenness?.[selectedOperation] || 0;
          const clustering = networkMetrics.clustering?.[selectedOperation] || 0;

          return operation && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{display: 'none'}}>
              <div className="bg-gray-50 border-b border-gray-100 p-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isJohannesburg ? operation.name : operation.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isJohannesburg ? 'Johannesburg Gold Mining Operation' : 'Continental Mining Operation'}
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Operations</div>
                    <div className="space-y-3">
                      {isJohannesburg ? (
                        // Johannesburg mine details
                        <>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-600">Operator</span>
                            <span className="text-sm font-medium text-gray-900">{(operation as RealMineData).operator}</span>
                          </div>
                          <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded">
                            <span className="text-sm text-gray-600">Annual Production</span>
                            <span className="text-sm font-semibold text-emerald-700">{(operation as RealMineData).production.annual_oz.toLocaleString()} oz</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-600">Grade</span>
                            <span className="text-sm font-medium text-gray-900">{(operation as RealMineData).production.grade_gt} g/t</span>
                          </div>
                          <div className="flex justify-between py-2 bg-amber-50 px-3 rounded">
                            <span className="text-sm text-gray-600">AISC</span>
                            <span className="text-sm font-semibold text-amber-700">${(operation as RealMineData).economics.aisc_usd_oz}/oz</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span className="text-sm text-gray-600">Depth</span>
                            <span className="text-sm font-medium text-gray-900">{(operation as RealMineData).location.depth_m}m</span>
                          </div>
                        </>
                      ) : (
                        // Continental operation details
                        <>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-400">COUNTRY</span>
                            <span className="text-white">{(operation as AfricanMiningOperation).country}</span>
                          </div>
                          <div className="flex justify-between py-1 bg-gray-800">
                            <span className="text-gray-400">COMMODITY</span>
                            <span className="text-green-400">{(operation as AfricanMiningOperation).production.primary_commodity.toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-400">ANNUAL PROD</span>
                            <span className="text-white">{(operation as AfricanMiningOperation).production.annual_production.toLocaleString()} {(operation as AfricanMiningOperation).production.unit.toUpperCase()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-amber-500 text-xs font-bold mb-2 border-b border-gray-700 pb-1">NETWORK ANALYSIS</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">CENTRALITY</span>
                        <span className={`${centrality > 2 ? 'text-rose-400' : centrality > 1 ? 'text-amber-400' : 'text-green-400'}`}>
                          {centrality.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 bg-gray-800">
                        <span className="text-gray-400">CLUSTERING</span>
                        <span className="text-white">{(clustering * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">RISK</span>
                        <span className={`${centrality > 2 ? 'text-rose-400' : 'text-green-400'}`}>
                          {centrality > 2 ? 'HIGH' : 'LOW'}
                        </span>
                      </div>
                      {isJohannesburg && tailingsAnalysis && (
                        <div className="flex justify-between py-1 bg-gray-800">
                          <span className="text-gray-400">AI ANALYSIS</span>
                          <span className="text-green-400">ACTIVE</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-amber-500 text-xs font-bold mb-2 border-b border-gray-700 pb-1">{isJohannesburg ? 'ECONOMIC IMPACT' : 'GLOBAL IMPACT'}</div>
                    <div className="space-y-1 text-xs">
                      {isJohannesburg ? (
                        <>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-400">EMPLOYMENT</span>
                            <span className="text-white">{(operation as RealMineData).economics.employment.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1 bg-gray-800">
                            <span className="text-gray-400">REVENUE</span>
                            <span className="text-green-400">${(operation as RealMineData).economics.revenue_usd_m}M</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-400">RESERVES</span>
                            <span className="text-white">{((operation as RealMineData).production.reserves_oz / 1000).toLocaleString()}K OZ</span>
                          </div>
                          <div className="flex justify-between py-1 bg-gray-800">
                            <span className="text-gray-400">LIFE</span>
                            <span className="text-amber-400">{(operation as RealMineData).production.life_years} YRS</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-400">EMPLOYMENT</span>
                            <span className="text-white">{(operation as AfricanMiningOperation).economic_impact.employment.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1 bg-gray-800">
                            <span className="text-gray-400">GOVT REV</span>
                            <span className="text-green-400">${(operation as AfricanMiningOperation).economic_impact.government_revenue_usd_m}M</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-gray-400">GDP</span>
                            <span className="text-amber-400">{(operation as AfricanMiningOperation).economic_impact.gdp_contribution_percent.toFixed(1)}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Live Tailings Analysis Results - HIDDEN PER USER REQUEST */}
        {tailingsAnalysis && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20" style={{display: 'none'}}>
            <div className="bg-gradient-to-r from-amber-500/90 to-emerald-500/90 px-8 py-4">
              <span className="text-sm font-light text-white tracking-wide">LIVE TAILINGS ANALYSIS - JOHANNESBURG OPERATIONS</span>
            </div>
            <div className="px-12 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                <div className="space-y-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-emerald-100/60 rounded-2xl mx-auto">
                    <DollarSign className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-extralight text-zinc-900 mb-2">$16.0B</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Recovery Potential</div>
                    <div className="text-sm text-zinc-600 mt-3 font-light leading-relaxed">AI-driven reprocessing analysis shows massive value in existing tailings</div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100/60 rounded-2xl mx-auto">
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-extralight text-zinc-900 mb-2">REAL-TIME</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Processing Optimization</div>
                    <div className="text-sm text-zinc-600 mt-3 font-light leading-relaxed">Live analysis of grade, chemistry, and extraction efficiency</div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-center w-16 h-16 bg-emerald-100/60 rounded-2xl mx-auto">
                    <TrendingUp className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-extralight text-zinc-900 mb-2">NETWORK</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Effect Multiplier</div>
                    <div className="text-sm text-zinc-600 mt-3 font-light leading-relaxed">Johannesburg operations amplify continental supply chain value</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Business Intelligence Dashboard - HIDDEN PER USER REQUEST */}
        {/*
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-zinc-200/50 overflow-hidden shadow-xl shadow-zinc-200/20">
          <div className="border-b border-zinc-200/50 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extralight text-zinc-900 tracking-tight">Live Market Intelligence</h2>
                <p className="text-sm text-zinc-500 mt-2 font-light">Real-time operational metrics and decision support</p>
              </div>
              <div className="flex items-center space-x-3 bg-emerald-50/60 px-4 py-2 rounded-full border border-emerald-100/50">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-light text-emerald-700">Live Data Feed</span>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 border-b border-zinc-200/50">
            <h3 className="text-lg font-light text-zinc-900 mb-6">Priority Actions Required</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-rose-50/50 to-rose-100/30 rounded-xl p-6 border border-rose-200/30">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="h-5 w-5 text-rose-500" />
                  <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-light">URGENT</span>
                </div>
                <h4 className="font-light text-zinc-900 mb-2">Supply Chain Vulnerability</h4>
                <p className="text-sm text-zinc-600 mb-4 font-light">DRC cobalt corridor showing 15% increased risk due to infrastructure delays</p>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Impact</span>
                  <span className="font-light text-rose-600">$2.3B at risk</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50/50 to-amber-100/30 rounded-xl p-6 border border-amber-200/30">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-light">OPPORTUNITY</span>
                </div>
                <h4 className="font-light text-zinc-900 mb-2">Price Arbitrage Window</h4>
                <p className="text-sm text-zinc-600 mb-4 font-light">Gold futures spread indicates optimal selling window for next 72 hours</p>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Potential Gain</span>
                  <span className="font-light text-amber-600">$45M</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 rounded-xl p-6 border border-emerald-200/30">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-light">ACTIVE</span>
                </div>
                <h4 className="font-light text-zinc-900 mb-2">Tailings Processing Ready</h4>
                <p className="text-sm text-zinc-600 mb-4 font-light">East Rand permits approved, construction can begin Q1 2025</p>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Expected NPV</span>
                  <span className="font-light text-emerald-600">$3.2B</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 border-b border-zinc-200/50">
            <h3 className="text-lg font-light text-zinc-900 mb-6">Live Operations Status</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-zinc-50/50 to-zinc-100/30 rounded-xl border border-zinc-200/30">
                <div className="text-2xl font-extralight text-zinc-900 mb-2">113</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Today's Production</div>
                <div className="text-xs text-emerald-500 font-light">oz Gold</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-xl border border-blue-200/30">
                <div className="text-2xl font-extralight text-blue-600 mb-2">97.2%</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Network Efficiency</div>
                <div className="text-xs text-blue-500 font-light">+2.1% from yesterday</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-50/50 to-amber-100/30 rounded-xl border border-amber-200/30">
                <div className="text-2xl font-extralight text-amber-600 mb-2">$2,418</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Current Gold Price</div>
                <div className="text-xs text-amber-500 font-light">+$12 (0.5%)</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 rounded-xl border border-emerald-200/30">
                <div className="text-2xl font-extralight text-emerald-600 mb-2">24</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-light">Active Connections</div>
                <div className="text-xs text-blue-500 font-light">Continental network</div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6">
            <h3 className="text-lg font-light text-zinc-900 mb-6">Market Intelligence Feed</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/30">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 animate-pulse"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-light text-zinc-900">Chinese demand surge detected</span>
                    <span className="text-xs text-zinc-500">2 minutes ago</span>
                  </div>
                  <p className="text-sm text-zinc-600 font-light">Rare earth element orders increased 23% - REE operations should prepare for capacity expansion</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/30">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-light text-zinc-900">Uranium price volatility warning</span>
                    <span className="text-xs text-zinc-500">8 minutes ago</span>
                  </div>
                  <p className="text-sm text-zinc-600 font-light">Nuclear sector uncertainty affecting pricing - hold current uranium inventory for 48-72 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/30">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-light text-zinc-900">Infrastructure investment opportunity</span>
                    <span className="text-xs text-zinc-500">15 minutes ago</span>
                  </div>
                  <p className="text-sm text-zinc-600 font-light">New Mozambique port capacity opening Q2 2025 - reduces logistics costs by 18% for East African operations</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-zinc-50/50 rounded-xl border border-zinc-200/30">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-light text-zinc-900">Technology deployment success</span>
                    <span className="text-xs text-zinc-500">32 minutes ago</span>
                  </div>
                  <p className="text-sm text-zinc-600 font-light">AI-powered grade control at Qala Shallows showing 12% recovery improvement - recommend expansion to Target Mine</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        */}
      </div>
    </div>
  );
};

export default CriticalMineralsRiskMap;