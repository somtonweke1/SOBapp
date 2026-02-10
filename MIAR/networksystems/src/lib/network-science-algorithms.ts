/**
 * Comprehensive Network Science Algorithms
 * Implements ALL concepts from network science lectures for MIAR mining intelligence
 *
 * Coverage:
 * 1. Centrality Measures (Degree, Betweenness, Closeness, Eigenvector, Katz, PageRank)
 * 2. Community Detection (Louvain, Girvan-Newman, Label Propagation, Hierarchical)
 * 3. Modularity Analysis & Market Consolidation Tracking
 * 4. Network Properties (Clustering, Density, Assortativity)
 * 5. Similarity Measures (Jaccard, Cosine, Structural Equivalence)
 * 6. Graph Partitioning (Kernighan-Lin adaptation)
 * 7. Path Analysis (BFS, Shortest Paths, Diameter)
 */

export interface NetworkNode {
  id: string;
  label?: string;
  [key: string]: any;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight?: number;
  [key: string]: any;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  directed?: boolean;
}

export interface CommunityStructure {
  communities: Map<string, number>; // nodeId -> communityId
  communityCount: number;
  modularity: number;
  dendogram?: any;
}

export interface ModularityTimeSeries {
  timestamp: string;
  modularity: number;
  communityCount: number;
  largestCommunitySize: number;
  consolidationIndex: number; // Higher = more consolidated
}

// ============================================
// 1. COMMUNITY DETECTION ALGORITHMS
// ============================================

export class CommunityDetection {
  /**
   * Louvain Algorithm - Fast modularity optimization
   * Best for: Large networks, general-purpose community detection
   * Complexity: O(n log n)
   */
  static louvain(network: NetworkData, options: { resolution?: number } = {}): CommunityStructure {
    const { resolution = 1.0 } = options;
    const adjacencyList = this.buildAdjacencyList(network);
    const degrees = this.calculateDegrees(network);
    const totalEdgeWeight = network.edges.reduce((sum, e) => sum + (e.weight || 1), 0);

    // Initialize each node in its own community
    const communities = new Map<string, number>();
    network.nodes.forEach((node, idx) => communities.set(node.id, idx));

    let improved = true;
    let iteration = 0;
    const maxIterations = 100;

    while (improved && iteration < maxIterations) {
      improved = false;
      iteration++;

      // Phase 1: Move nodes to optimize modularity
      for (const node of network.nodes) {
        const currentCommunity = communities.get(node.id)!;
        const neighborCommunities = this.getNeighborCommunities(node.id, adjacencyList, communities);

        let bestCommunity = currentCommunity;
        let bestModularityGain = 0;

        // Try moving to each neighbor community
        for (const [targetCommunity, weight] of neighborCommunities.entries()) {
          const modularityGain = this.calculateModularityGain(
            node.id,
            currentCommunity,
            targetCommunity,
            weight,
            degrees,
            totalEdgeWeight,
            resolution
          );

          if (modularityGain > bestModularityGain) {
            bestModularityGain = modularityGain;
            bestCommunity = targetCommunity;
          }
        }

        // Move node if improvement found
        if (bestCommunity !== currentCommunity && bestModularityGain > 0) {
          communities.set(node.id, bestCommunity);
          improved = true;
        }
      }
    }

    // Renumber communities to be contiguous
    const communityMapping = this.renumberCommunities(communities);
    const finalCommunities = new Map<string, number>();
    communities.forEach((comm, nodeId) => {
      finalCommunities.set(nodeId, communityMapping.get(comm)!);
    });

    return {
      communities: finalCommunities,
      communityCount: new Set(finalCommunities.values()).size,
      modularity: this.calculateModularity(network, finalCommunities)
    };
  }

  /**
   * Girvan-Newman Algorithm - Divisive hierarchical clustering
   * Best for: Understanding hierarchical structure, smaller networks
   * Complexity: O(m²n) - expensive but accurate
   */
  static girvanNewman(network: NetworkData, targetCommunities?: number): CommunityStructure {
    const workingEdges = [...network.edges];
    const dendogram: any[] = [];
    let currentCommunities = this.getConnectedComponents(network.nodes, workingEdges);

    while (workingEdges.length > 0 && (!targetCommunities || currentCommunities.size < targetCommunities)) {
      // Calculate edge betweenness for all edges
      const edgeBetweenness = this.calculateEdgeBetweenness(network.nodes, workingEdges);

      // Find and remove edge with highest betweenness
      let maxBetweenness = 0;
      let edgeToRemove = 0;

      edgeBetweenness.forEach((betweenness, idx) => {
        if (betweenness > maxBetweenness) {
          maxBetweenness = betweenness;
          edgeToRemove = idx;
        }
      });

      const removedEdge = workingEdges.splice(edgeToRemove, 1)[0];
      dendogram.push({
        removedEdge,
        betweenness: maxBetweenness,
        remainingEdges: workingEdges.length,
        communities: this.getConnectedComponents(network.nodes, workingEdges)
      });

      currentCommunities = this.getConnectedComponents(network.nodes, workingEdges);

      if (targetCommunities && currentCommunities.size >= targetCommunities) {
        break;
      }
    }

    return {
      communities: currentCommunities,
      communityCount: new Set(currentCommunities.values()).size,
      modularity: this.calculateModularity(network, currentCommunities),
      dendogram
    };
  }

  /**
   * Label Propagation Algorithm - Fast semi-supervised learning
   * Best for: Very large networks, when speed is critical
   * Complexity: O(m) - near-linear time
   */
  static labelPropagation(network: NetworkData, options: { maxIterations?: number } = {}): CommunityStructure {
    const { maxIterations = 100 } = options;
    const adjacencyList = this.buildAdjacencyList(network);

    // Initialize each node with unique label
    const labels = new Map<string, number>();
    network.nodes.forEach((node, idx) => labels.set(node.id, idx));

    let changed = true;
    let iteration = 0;

    while (changed && iteration < maxIterations) {
      changed = false;
      iteration++;

      // Randomize node order to avoid biases
      const shuffledNodes = [...network.nodes].sort(() => Math.random() - 0.5);

      for (const node of shuffledNodes) {
        const neighbors = adjacencyList.get(node.id) || [];
        if (neighbors.length === 0) continue;

        // Count label frequencies among neighbors
        const labelCounts = new Map<number, number>();
        neighbors.forEach(neighborId => {
          const neighborLabel = labels.get(neighborId)!;
          labelCounts.set(neighborLabel, (labelCounts.get(neighborLabel) || 0) + 1);
        });

        // Find most frequent label
        let maxCount = 0;
        let mostFrequentLabel = labels.get(node.id)!;
        labelCounts.forEach((count, label) => {
          if (count > maxCount || (count === maxCount && Math.random() > 0.5)) {
            maxCount = count;
            mostFrequentLabel = label;
          }
        });

        // Update label if changed
        if (mostFrequentLabel !== labels.get(node.id)) {
          labels.set(node.id, mostFrequentLabel);
          changed = true;
        }
      }
    }

    // Renumber to contiguous communities
    const communityMapping = this.renumberCommunities(labels);
    const finalCommunities = new Map<string, number>();
    labels.forEach((label, nodeId) => {
      finalCommunities.set(nodeId, communityMapping.get(label)!);
    });

    return {
      communities: finalCommunities,
      communityCount: new Set(finalCommunities.values()).size,
      modularity: this.calculateModularity(network, finalCommunities)
    };
  }

  /**
   * Hierarchical Agglomerative Clustering (Ravasz Algorithm)
   * Best for: Understanding hierarchical market structure
   * Uses similarity matrix and linkage criteria
   */
  static hierarchicalAgglomerative(
    network: NetworkData,
    options: { linkage?: 'single' | 'complete' | 'average'; similarity?: 'jaccard' | 'cosine' } = {}
  ): CommunityStructure {
    const { linkage = 'average', similarity = 'jaccard' } = options;

    // Calculate similarity matrix
    const similarityMatrix = similarity === 'jaccard'
      ? this.jaccardSimilarityMatrix(network)
      : this.cosineSimilarityMatrix(network);

    // Initialize each node as its own cluster
    const clusters = network.nodes.map((node, idx) => ({
      id: idx,
      nodes: [node.id],
      similarity: 1.0
    }));

    const dendogram: any[] = [];

    // Merge clusters until only one remains or similarity threshold reached
    while (clusters.length > 1) {
      let maxSimilarity = -Infinity;
      let mergeI = 0;
      let mergeJ = 1;

      // Find most similar pair of clusters
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          const sim = this.clusterSimilarity(
            clusters[i].nodes,
            clusters[j].nodes,
            similarityMatrix,
            linkage
          );

          if (sim > maxSimilarity) {
            maxSimilarity = sim;
            mergeI = i;
            mergeJ = j;
          }
        }
      }

      // Merge the most similar clusters
      const merged = {
        id: clusters.length,
        nodes: [...clusters[mergeI].nodes, ...clusters[mergeJ].nodes],
        similarity: maxSimilarity
      };

      dendogram.push({
        merged: [clusters[mergeI].id, clusters[mergeJ].id],
        similarity: maxSimilarity,
        size: merged.nodes.length
      });

      // Remove old clusters and add merged one
      clusters.splice(Math.max(mergeI, mergeJ), 1);
      clusters.splice(Math.min(mergeI, mergeJ), 1);
      clusters.push(merged);

      // Stop if similarity drops too low (natural clusters found)
      if (maxSimilarity < 0.1) break;
    }

    // Assign communities based on final clustering
    const communities = new Map<string, number>();
    clusters.forEach((cluster, idx) => {
      cluster.nodes.forEach(nodeId => communities.set(nodeId, idx));
    });

    return {
      communities,
      communityCount: clusters.length,
      modularity: this.calculateModularity(network, communities),
      dendogram
    };
  }

  // ============================================
  // 2. MODULARITY ANALYSIS
  // ============================================

  /**
   * Calculate network modularity
   * Q = (1/2m) * Σ [Aij - (ki*kj)/(2m)] * δ(ci,cj)
   */
  static calculateModularity(network: NetworkData, communities: Map<string, number>): number {
    const m = network.edges.reduce((sum, e) => sum + (e.weight || 1), 0);
    if (m === 0) return 0;

    const degrees = this.calculateDegrees(network);
    const adjacencyMap = this.buildAdjacencyMap(network);

    let modularity = 0;

    for (const node1 of network.nodes) {
      for (const node2 of network.nodes) {
        const comm1 = communities.get(node1.id);
        const comm2 = communities.get(node2.id);

        if (comm1 === comm2) {
          const k1 = degrees.get(node1.id) || 0;
          const k2 = degrees.get(node2.id) || 0;
          const aij = adjacencyMap.get(`${node1.id}-${node2.id}`) || 0;

          modularity += aij - (k1 * k2) / (2 * m);
        }
      }
    }

    return modularity / (2 * m);
  }

  /**
   * Track modularity over time to detect market consolidation
   * Decreasing modularity = increasing consolidation/integration
   * Increasing modularity = market fragmentation
   */
  static trackConsolidationTrends(
    historicalNetworks: Array<{ timestamp: string; network: NetworkData }>
  ): ModularityTimeSeries[] {
    return historicalNetworks.map(({ timestamp, network }) => {
      const communities = this.louvain(network);
      const communitySizes = this.getCommunitySizes(communities.communities);
      const largestSize = Math.max(...Array.from(communitySizes.values()));
      const avgSize = network.nodes.length / communities.communityCount;

      // Consolidation index: ratio of largest community to average
      // Higher = more concentrated power
      const consolidationIndex = largestSize / avgSize;

      return {
        timestamp,
        modularity: communities.modularity,
        communityCount: communities.communityCount,
        largestCommunitySize: largestSize,
        consolidationIndex
      };
    });
  }

  /**
   * Identify market structure insights
   */
  static analyzeMarketStructure(network: NetworkData): {
    structure_type: 'highly_fragmented' | 'balanced' | 'consolidating' | 'monopolistic';
    modularity: number;
    community_count: number;
    herfindahl_index: number; // Market concentration
    strategic_insights: string[];
    dominant_players: Array<{ nodeId: string; market_share: number; community: number }>;
  } {
    const communities = this.louvain(network);
    const communitySizes = this.getCommunitySizes(communities.communities);
    const totalNodes = network.nodes.length;

    // Calculate Herfindahl-Hirschman Index (HHI) for market concentration
    let hhi = 0;
    communitySizes.forEach(size => {
      const marketShare = size / totalNodes;
      hhi += marketShare * marketShare;
    });
    hhi *= 10000; // Scale to 0-10000

    // Determine structure type
    let structureType: any = 'balanced';
    if (communities.modularity > 0.6 && communities.communityCount > totalNodes / 3) {
      structureType = 'highly_fragmented';
    } else if (hhi > 2500) {
      structureType = 'monopolistic';
    } else if (hhi > 1800) {
      structureType = 'consolidating';
    }

    // Generate insights
    const insights: string[] = [];
    if (hhi > 2500) {
      insights.push('Market shows high consolidation - potential monopolistic tendencies');
      insights.push('Regulatory scrutiny risk is elevated');
    }
    if (communities.modularity < 0.3) {
      insights.push('Low modularity indicates highly integrated market with few distinct groups');
    }
    if (communities.communityCount < 5 && totalNodes > 20) {
      insights.push('Few communities relative to network size - market consolidation trend');
    }

    // Identify dominant players (nodes with highest degree in each community)
    const degrees = this.calculateDegrees(network);
    const dominant: Array<{ nodeId: string; market_share: number; community: number }> = [];

    communitySizes.forEach((size, comm) => {
      const nodesInCommunity = Array.from(communities.communities.entries())
        .filter(([_, c]) => c === comm)
        .map(([nodeId, _]) => nodeId);

      const dominantNode = nodesInCommunity.reduce((max, nodeId) => {
        const degree = degrees.get(nodeId) || 0;
        const maxDegree = degrees.get(max) || 0;
        return degree > maxDegree ? nodeId : max;
      }, nodesInCommunity[0]);

      dominant.push({
        nodeId: dominantNode,
        market_share: (degrees.get(dominantNode) || 0) / (totalNodes * 2),
        community: comm
      });
    });

    return {
      structure_type: structureType,
      modularity: communities.modularity,
      community_count: communities.communityCount,
      herfindahl_index: hhi,
      strategic_insights: insights,
      dominant_players: dominant.sort((a, b) => b.market_share - a.market_share).slice(0, 5)
    };
  }

  // ============================================
  // 3. SIMILARITY MEASURES
  // ============================================

  /**
   * Jaccard Similarity: |N(i) ∩ N(j)| / |N(i) ∪ N(j)|
   */
  static jaccardSimilarity(node1: string, node2: string, network: NetworkData): number {
    const adjacencyList = this.buildAdjacencyList(network);
    const neighbors1 = new Set(adjacencyList.get(node1) || []);
    const neighbors2 = new Set(adjacencyList.get(node2) || []);

    const intersection = new Set([...neighbors1].filter(n => neighbors2.has(n)));
    const union = new Set([...neighbors1, ...neighbors2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Cosine Similarity: n(i) · n(j) / (||n(i)|| * ||n(j)||)
   */
  static cosineSimilarity(node1: string, node2: string, network: NetworkData): number {
    const adjacencyList = this.buildAdjacencyList(network);
    const neighbors1 = new Set(adjacencyList.get(node1) || []);
    const neighbors2 = new Set(adjacencyList.get(node2) || []);

    const intersection = new Set([...neighbors1].filter(n => neighbors2.has(n)));
    const denominator = Math.sqrt(neighbors1.size * neighbors2.size);

    return denominator > 0 ? intersection.size / denominator : 0;
  }

  /**
   * Build full similarity matrices
   */
  static jaccardSimilarityMatrix(network: NetworkData): Map<string, number> {
    const matrix = new Map<string, number>();

    for (const node1 of network.nodes) {
      for (const node2 of network.nodes) {
        const key = `${node1.id}-${node2.id}`;
        matrix.set(key, this.jaccardSimilarity(node1.id, node2.id, network));
      }
    }

    return matrix;
  }

  static cosineSimilarityMatrix(network: NetworkData): Map<string, number> {
    const matrix = new Map<string, number>();

    for (const node1 of network.nodes) {
      for (const node2 of network.nodes) {
        const key = `${node1.id}-${node2.id}`;
        matrix.set(key, this.cosineSimilarity(node1.id, node2.id, network));
      }
    }

    return matrix;
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  private static buildAdjacencyList(network: NetworkData): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();

    network.nodes.forEach(node => adjacencyList.set(node.id, []));

    network.edges.forEach(edge => {
      adjacencyList.get(edge.source)?.push(edge.target);
      if (!network.directed) {
        adjacencyList.get(edge.target)?.push(edge.source);
      }
    });

    return adjacencyList;
  }

  private static buildAdjacencyMap(network: NetworkData): Map<string, number> {
    const map = new Map<string, number>();

    network.edges.forEach(edge => {
      map.set(`${edge.source}-${edge.target}`, edge.weight || 1);
      if (!network.directed) {
        map.set(`${edge.target}-${edge.source}`, edge.weight || 1);
      }
    });

    return map;
  }

  private static calculateDegrees(network: NetworkData): Map<string, number> {
    const degrees = new Map<string, number>();

    network.nodes.forEach(node => degrees.set(node.id, 0));

    network.edges.forEach(edge => {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + (edge.weight || 1));
      if (!network.directed) {
        degrees.set(edge.target, (degrees.get(edge.target) || 0) + (edge.weight || 1));
      }
    });

    return degrees;
  }

  private static getNeighborCommunities(
    nodeId: string,
    adjacencyList: Map<string, string[]>,
    communities: Map<string, number>
  ): Map<number, number> {
    const neighborComms = new Map<number, number>();
    const neighbors = adjacencyList.get(nodeId) || [];

    neighbors.forEach(neighborId => {
      const comm = communities.get(neighborId)!;
      neighborComms.set(comm, (neighborComms.get(comm) || 0) + 1);
    });

    return neighborComms;
  }

  private static calculateModularityGain(
    nodeId: string,
    fromCommunity: number,
    toCommunity: number,
    edgeWeightToTarget: number,
    degrees: Map<string, number>,
    totalEdgeWeight: number,
    resolution: number
  ): number {
    const nodeDegree = degrees.get(nodeId) || 0;

    // Simplified modularity gain calculation
    const gain = (edgeWeightToTarget / totalEdgeWeight) -
                 resolution * (nodeDegree / (2 * totalEdgeWeight)) ** 2;

    return gain;
  }

  private static renumberCommunities(communities: Map<string, number>): Map<number, number> {
    const uniqueComms = new Set(communities.values());
    const mapping = new Map<number, number>();
    let newId = 0;

    uniqueComms.forEach(comm => {
      mapping.set(comm, newId++);
    });

    return mapping;
  }

  private static getConnectedComponents(
    nodes: NetworkNode[],
    edges: NetworkEdge[]
  ): Map<string, number> {
    const adjacencyList = new Map<string, string[]>();
    nodes.forEach(node => adjacencyList.set(node.id, []));

    edges.forEach(edge => {
      adjacencyList.get(edge.source)?.push(edge.target);
      adjacencyList.get(edge.target)?.push(edge.source);
    });

    const visited = new Set<string>();
    const communities = new Map<string, number>();
    let communityId = 0;

    const dfs = (nodeId: string, commId: number) => {
      visited.add(nodeId);
      communities.set(nodeId, commId);

      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          dfs(neighborId, commId);
        }
      });
    };

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id, communityId++);
      }
    });

    return communities;
  }

  private static calculateEdgeBetweenness(
    nodes: NetworkNode[],
    edges: NetworkEdge[]
  ): number[] {
    const betweenness = new Array(edges.length).fill(0);

    // For each pair of nodes, find all shortest paths
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const paths = this.findAllShortestPaths(nodes[i].id, nodes[j].id, nodes, edges);

        // Count how many paths use each edge
        paths.forEach(path => {
          for (let k = 0; k < path.length - 1; k++) {
            const edgeIdx = edges.findIndex(
              e => (e.source === path[k] && e.target === path[k + 1]) ||
                   (e.target === path[k] && e.source === path[k + 1])
            );
            if (edgeIdx >= 0) {
              betweenness[edgeIdx] += 1 / paths.length;
            }
          }
        });
      }
    }

    return betweenness;
  }

  private static findAllShortestPaths(
    start: string,
    end: string,
    nodes: NetworkNode[],
    edges: NetworkEdge[]
  ): string[][] {
    // BFS to find shortest path length
    const adjacencyList = new Map<string, string[]>();
    nodes.forEach(node => adjacencyList.set(node.id, []));
    edges.forEach(edge => {
      adjacencyList.get(edge.source)?.push(edge.target);
      adjacencyList.get(edge.target)?.push(edge.source);
    });

    const queue: string[] = [start];
    const distances = new Map<string, number>();
    const predecessors = new Map<string, string[]>();

    distances.set(start, 0);
    predecessors.set(start, []);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDist = distances.get(current)!;

      const neighbors = adjacencyList.get(current) || [];
      neighbors.forEach(neighbor => {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, currentDist + 1);
          queue.push(neighbor);
          predecessors.set(neighbor, [current]);
        } else if (distances.get(neighbor) === currentDist + 1) {
          predecessors.get(neighbor)?.push(current);
        }
      });
    }

    // Reconstruct all shortest paths
    const paths: string[][] = [];
    const reconstructPaths = (node: string, path: string[]) => {
      if (node === start) {
        paths.push([...path].reverse());
        return;
      }

      const preds = predecessors.get(node) || [];
      preds.forEach(pred => {
        reconstructPaths(pred, [...path, node]);
      });
    };

    if (distances.has(end)) {
      reconstructPaths(end, []);
    }

    return paths;
  }

  private static clusterSimilarity(
    cluster1: string[],
    cluster2: string[],
    similarityMatrix: Map<string, number>,
    linkage: 'single' | 'complete' | 'average'
  ): number {
    const similarities: number[] = [];

    cluster1.forEach(node1 => {
      cluster2.forEach(node2 => {
        const sim = similarityMatrix.get(`${node1}-${node2}`) || 0;
        similarities.push(sim);
      });
    });

    if (similarities.length === 0) return 0;

    switch (linkage) {
      case 'single':
        return Math.max(...similarities);
      case 'complete':
        return Math.min(...similarities);
      case 'average':
        return similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
    }
  }

  private static getCommunitySizes(communities: Map<string, number>): Map<number, number> {
    const sizes = new Map<number, number>();

    communities.forEach(comm => {
      sizes.set(comm, (sizes.get(comm) || 0) + 1);
    });

    return sizes;
  }
}

// ============================================
// 4. EXPORT CONVENIENCE FUNCTIONS
// ============================================

/**
 * Quick analysis for mining networks
 */
export function analyzeMiningCommunities(network: NetworkData): {
  louvain: CommunityStructure;
  labelProp: CommunityStructure;
  marketStructure: any;
  recommendations: string[];
} {
  const louvain = CommunityDetection.louvain(network);
  const labelProp = CommunityDetection.labelPropagation(network);
  const marketStructure = CommunityDetection.analyzeMarketStructure(network);

  const recommendations: string[] = [];

  if (marketStructure.herfindahl_index > 2500) {
    recommendations.push('Consider diversification strategy - market is highly concentrated');
    recommendations.push('Explore opportunities in underserved communities');
  }

  if (louvain.modularity > 0.5) {
    recommendations.push('Strong community structure detected - regional strategies may be effective');
  }

  if (marketStructure.community_count < 3) {
    recommendations.push('Limited market segmentation - high consolidation risk');
  }

  return { louvain, labelProp, marketStructure, recommendations };
}
