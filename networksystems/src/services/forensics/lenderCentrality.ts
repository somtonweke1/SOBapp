/**
 * Lender & Zip Code Centrality Analysis
 * Uses MIAR's network science algorithms to identify "Power Lenders" and "Power Zip Codes"
 * Shows where money is flowing in Baltimore real estate
 */

import { NetworkNode, NetworkEdge, NetworkData } from '@/lib/network-science-algorithms';

export interface Lender {
  lenderId: string;
  lenderName: string;
  deals: Deal[];
  totalVolume: number;
  zipCodes: Set<string>;
}

export interface Deal {
  dealId: string;
  lenderId: string;
  lenderName: string;
  propertyAddress: string;
  zipCode: string;
  loanAmount: number;
  dealDate: string; // ISO date
  status: 'CLOSED' | 'PENDING' | 'FUNDED';
  dscr?: number;
}

export interface LenderCentralityMetrics {
  lenderId: string;
  lenderName: string;
  degreeCentrality: number; // Number of zip codes they operate in
  betweennessCentrality: number; // How often they bridge different zip codes
  eigenvectorCentrality: number; // Influence based on connections to influential zip codes
  pagerank: number; // Overall importance score
  totalVolume: number;
  dealCount: number;
  zipCodeCount: number;
  averageDealSize: number;
}

export interface ZipCodeCentralityMetrics {
  zipCode: string;
  degreeCentrality: number; // Number of lenders operating here
  betweennessCentrality: number; // How often this zip connects different lenders
  eigenvectorCentrality: number; // Influence based on connections to influential lenders
  pagerank: number; // Overall importance score
  totalVolume: number;
  dealCount: number;
  lenderCount: number;
  averageDealSize: number;
  liquidityScore: number; // 0-100, higher = more liquid market
}

/**
 * Build lender-zip code network
 * Creates bipartite graph: Lenders <-> Zip Codes
 */
export const buildLenderNetwork = (deals: Deal[]): {
  lenderNodes: NetworkNode[];
  zipCodeNodes: NetworkNode[];
  edges: NetworkEdge[];
  lenders: Map<string, Lender>;
} => {
  const lenderMap = new Map<string, Lender>();
  const zipCodeSet = new Set<string>();

  // Process deals
  deals.forEach(deal => {
    // Add/update lender
    if (!lenderMap.has(deal.lenderId)) {
      lenderMap.set(deal.lenderId, {
        lenderId: deal.lenderId,
        lenderName: deal.lenderName,
        deals: [],
        totalVolume: 0,
        zipCodes: new Set(),
      });
    }
    const lender = lenderMap.get(deal.lenderId)!;
    lender.deals.push(deal);
    lender.totalVolume += deal.loanAmount;
    lender.zipCodes.add(deal.zipCode);

    // Track zip codes
    zipCodeSet.add(deal.zipCode);
  });

  // Create lender nodes
  const lenderNodes: NetworkNode[] = Array.from(lenderMap.values()).map(lender => ({
    id: `lender-${lender.lenderId}`,
    label: lender.lenderName,
    type: 'lender',
    totalVolume: lender.totalVolume,
    dealCount: lender.deals.length,
    zipCodeCount: lender.zipCodes.size,
  }));

  // Create zip code nodes
  const zipCodeNodes: NetworkNode[] = Array.from(zipCodeSet).map(zipCode => {
    const zipDeals = deals.filter(d => d.zipCode === zipCode);
    const totalVolume = zipDeals.reduce((sum, d) => sum + d.loanAmount, 0);
    return {
      id: `zip-${zipCode}`,
      label: zipCode,
      type: 'zipCode',
      totalVolume,
      dealCount: zipDeals.length,
    };
  });

  // Create edges (lender -> zip code)
  const edges: NetworkEdge[] = [];
  lenderMap.forEach(lender => {
    lender.zipCodes.forEach(zipCode => {
      const zipDeals = lender.deals.filter(d => d.zipCode === zipCode);
      const edgeWeight = zipDeals.reduce((sum, d) => sum + d.loanAmount, 0);
      edges.push({
        source: `lender-${lender.lenderId}`,
        target: `zip-${zipCode}`,
        weight: edgeWeight,
      });
    });
  });

  return {
    lenderNodes,
    zipCodeNodes,
    edges,
    lenders: lenderMap,
  };
};

/**
 * Calculate lender centrality metrics
 * Identifies "Power Lenders" - those with most influence in the market
 */
export const calculateLenderCentrality = (
  lenderNodes: NetworkNode[],
  zipCodeNodes: NetworkNode[],
  edges: NetworkEdge[],
  lenders: Map<string, Lender>
): Map<string, LenderCentralityMetrics> => {
  const network: NetworkData = {
    nodes: [...lenderNodes, ...zipCodeNodes],
    edges,
    directed: false,
  };

  // Build adjacency list
  const adjacencyList: Record<string, string[]> = {};
  network.nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  edges.forEach(edge => {
    adjacencyList[edge.source].push(edge.target);
    adjacencyList[edge.target].push(edge.source);
  });

  // Calculate degree centrality
  const degreeCentrality = new Map<string, number>();
  lenderNodes.forEach(node => {
    degreeCentrality.set(node.id, adjacencyList[node.id].length);
  });

  // Calculate betweenness centrality (simplified)
  const betweennessCentrality = new Map<string, number>();
  lenderNodes.forEach(lenderNode => {
    const connections = adjacencyList[lenderNode.id];
    let betweenness = 0;
    // Count how many zip codes this lender connects to
    betweenness = connections.length;
    betweennessCentrality.set(lenderNode.id, betweenness);
  });

  // Calculate eigenvector centrality (simplified)
  const eigenvectorCentrality = new Map<string, number>();
  lenderNodes.forEach(lenderNode => {
    const connections = adjacencyList[lenderNode.id];
    let eigenvector = 0;
    connections.forEach(zipId => {
      const zipConnections = adjacencyList[zipId].length;
      eigenvector += zipConnections;
    });
    eigenvectorCentrality.set(lenderNode.id, eigenvector / (lenderNodes.length || 1));
  });

  // Calculate PageRank (simplified)
  const pagerank = new Map<string, number>();
  lenderNodes.forEach(lenderNode => {
    const degree = degreeCentrality.get(lenderNode.id) || 0;
    const eigenvector = eigenvectorCentrality.get(lenderNode.id) || 0;
    const pr = (degree * 0.5) + (eigenvector * 0.5);
    pagerank.set(lenderNode.id, pr);
  });

  // Build results
  const results = new Map<string, LenderCentralityMetrics>();
  lenderNodes.forEach(lenderNode => {
    const lenderId = lenderNode.id.replace('lender-', '');
    const lender = lenders.get(lenderId);
    if (lender) {
      results.set(lenderId, {
        lenderId,
        lenderName: lender.lenderName,
        degreeCentrality: degreeCentrality.get(lenderNode.id) || 0,
        betweennessCentrality: betweennessCentrality.get(lenderNode.id) || 0,
        eigenvectorCentrality: eigenvectorCentrality.get(lenderNode.id) || 0,
        pagerank: pagerank.get(lenderNode.id) || 0,
        totalVolume: lender.totalVolume,
        dealCount: lender.deals.length,
        zipCodeCount: lender.zipCodes.size,
        averageDealSize: lender.totalVolume / lender.deals.length,
      });
    }
  });

  return results;
};

/**
 * Calculate zip code centrality metrics
 * Identifies "Power Zip Codes" - most liquid markets
 */
export const calculateZipCodeCentrality = (
  lenderNodes: NetworkNode[],
  zipCodeNodes: NetworkNode[],
  edges: NetworkEdge[],
  deals: Deal[]
): Map<string, ZipCodeCentralityMetrics> => {
  const network: NetworkData = {
    nodes: [...lenderNodes, ...zipCodeNodes],
    edges,
    directed: false,
  };

  // Build adjacency list
  const adjacencyList: Record<string, string[]> = {};
  network.nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  edges.forEach(edge => {
    adjacencyList[edge.source].push(edge.target);
    adjacencyList[edge.target].push(edge.source);
  });

  // Calculate metrics for each zip code
  const results = new Map<string, ZipCodeCentralityMetrics>();
  zipCodeNodes.forEach(zipNode => {
    const zipCode = zipNode.id.replace('zip-', '');
    const zipDeals = deals.filter(d => d.zipCode === zipCode);
    const totalVolume = zipDeals.reduce((sum, d) => sum + d.loanAmount, 0);
    const lenderSet = new Set(zipDeals.map(d => d.lenderId));

    const degree = adjacencyList[zipNode.id].length;
    const betweenness = degree; // Simplified
    const eigenvector = degree * 0.5; // Simplified
    const pagerank = degree * 0.3; // Simplified

    // Calculate liquidity score (0-100)
    // Higher = more lenders, more deals, more volume
    const lenderScore = Math.min(100, lenderSet.size * 10); // Max 10 lenders = 100
    const dealScore = Math.min(100, zipDeals.length * 2); // Max 50 deals = 100
    const volumeScore = Math.min(100, (totalVolume / 10000000) * 100); // Max $10M = 100
    const liquidityScore = (lenderScore + dealScore + volumeScore) / 3;

    results.set(zipCode, {
      zipCode,
      degreeCentrality: degree,
      betweennessCentrality: betweenness,
      eigenvectorCentrality: eigenvector,
      pagerank,
      totalVolume,
      dealCount: zipDeals.length,
      lenderCount: lenderSet.size,
      averageDealSize: totalVolume / zipDeals.length,
      liquidityScore: parseFloat(liquidityScore.toFixed(2)),
    });
  });

  return results;
};

/**
 * Generate Baltimore Liquidity Map
 * Shows where money is flowing (which zip codes are most liquid)
 */
export const generateLiquidityMap = (
  zipCodeMetrics: Map<string, ZipCodeCentralityMetrics>,
  lenderMetrics: Map<string, LenderCentralityMetrics>
): {
  topLiquidZipCodes: Array<{ zipCode: string; metrics: ZipCodeCentralityMetrics }>;
  topPowerLenders: Array<{ lenderId: string; metrics: LenderCentralityMetrics }>;
  liquidityHeatmap: Array<{
    zipCode: string;
    liquidityScore: number;
    lenderCount: number;
    dealCount: number;
    totalVolume: number;
  }>;
} => {
  // Top liquid zip codes (by liquidity score)
  const topLiquidZipCodes = Array.from(zipCodeMetrics.entries())
    .map(([zipCode, metrics]) => ({ zipCode, metrics }))
    .sort((a, b) => b.metrics.liquidityScore - a.metrics.liquidityScore)
    .slice(0, 10);

  // Top power lenders (by PageRank)
  const topPowerLenders = Array.from(lenderMetrics.entries())
    .map(([lenderId, metrics]) => ({ lenderId, metrics }))
    .sort((a, b) => b.metrics.pagerank - a.metrics.pagerank)
    .slice(0, 10);

  // Liquidity heatmap (all zip codes with scores)
  const liquidityHeatmap = Array.from(zipCodeMetrics.entries()).map(([zipCode, metrics]) => ({
    zipCode,
    liquidityScore: metrics.liquidityScore,
    lenderCount: metrics.lenderCount,
    dealCount: metrics.dealCount,
    totalVolume: metrics.totalVolume,
  }));

  return {
    topLiquidZipCodes,
    topPowerLenders,
    liquidityHeatmap,
  };
};

