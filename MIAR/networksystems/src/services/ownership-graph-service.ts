/**
 * Ownership Graph Service
 * Multi-level ownership structure detection
 * Catches complex evasion attempts: Supplier → Parent → Grandparent → BIS Entity
 */

import { BISEntityFull } from './bis-scraper-service';

export interface OwnershipNode {
  name: string;
  normalizedName: string;
  isBISEntity: boolean;
  bisEntity?: BISEntityFull;
  level: number; // 0 = original supplier, 1 = parent, 2 = grandparent, etc.
}

export interface OwnershipEdge {
  from: string; // subsidiary
  to: string; // parent
  relationshipType: 'parent' | 'subsidiary' | 'affiliate' | 'officer' | 'shareholder';
  confidence: number;
  source: string;
  evidence: string[];
}

export interface OwnershipPath {
  nodes: OwnershipNode[];
  edges: OwnershipEdge[];
  bisEntity: BISEntityFull;
  totalConfidence: number; // Decayed confidence across path
  pathLength: number;
  pathString: string; // "Supplier → Parent → Grandparent → BIS Entity"
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
}

export class OwnershipGraphService {
  private nodes: Map<string, OwnershipNode> = new Map();
  private edges: OwnershipEdge[] = [];
  private bisEntitiesMap: Map<string, BISEntityFull> = new Map();

  // Confidence decay: Each level reduces confidence
  private readonly CONFIDENCE_DECAY_RATE = 0.85; // 15% reduction per level
  private readonly MAX_DEPTH = 5; // Stop after 5 levels

  /**
   * Build ownership graph from relationships
   */
  public buildGraph(
    relationships: OwnershipEdge[],
    bisEntities: BISEntityFull[]
  ): void {
    console.log('🔨 Building ownership graph...');

    // Clear existing graph
    this.nodes.clear();
    this.edges = [];
    this.bisEntitiesMap.clear();

    // Index BIS entities for fast lookup
    for (const entity of bisEntities) {
      const normalized = this.normalizeName(entity.name);
      this.bisEntitiesMap.set(normalized, entity);
    }

    // Add edges
    for (const edge of relationships) {
      this.edges.push(edge);

      // Create nodes if they don't exist
      if (!this.nodes.has(edge.from)) {
        this.addNode(edge.from);
      }
      if (!this.nodes.has(edge.to)) {
        this.addNode(edge.to);
      }
    }

    console.log(`✅ Graph built: ${this.nodes.size} nodes, ${this.edges.length} edges`);
  }

  /**
   * Add node to graph
   */
  private addNode(name: string): void {
    const normalized = this.normalizeName(name);
    const isBISEntity = this.bisEntitiesMap.has(normalized);

    this.nodes.set(normalized, {
      name,
      normalizedName: normalized,
      isBISEntity,
      bisEntity: isBISEntity ? this.bisEntitiesMap.get(normalized) : undefined,
      level: 0 // Will be set during path finding
    });
  }

  /**
   * Find all ownership paths from supplier to BIS entities
   */
  public findOwnershipPaths(supplierName: string): OwnershipPath[] {
    const normalized = this.normalizeName(supplierName);
    console.log(`🔍 Finding ownership paths for: "${supplierName}"`);

    // Add supplier as node if not in graph
    if (!this.nodes.has(normalized)) {
      this.addNode(supplierName);
    }

    const paths: OwnershipPath[] = [];
    const visited = new Set<string>();

    // DFS to find all paths to BIS entities
    this.dfsSearch(
      normalized,
      [],
      [],
      1.0, // Start with 100% confidence
      0,
      visited,
      paths
    );

    console.log(`✅ Found ${paths.length} ownership paths`);
    return paths;
  }

  /**
   * Depth-first search for ownership paths
   */
  private dfsSearch(
    currentNode: string,
    pathNodes: OwnershipNode[],
    pathEdges: OwnershipEdge[],
    currentConfidence: number,
    depth: number,
    visited: Set<string>,
    results: OwnershipPath[]
  ): void {
    // Stop if max depth reached
    if (depth > this.MAX_DEPTH) {
      return;
    }

    // Mark as visited
    visited.add(currentNode);

    const node = this.nodes.get(currentNode);
    if (!node) {
      visited.delete(currentNode);
      return;
    }

    // Add current node to path
    const nodeWithLevel = { ...node, level: depth };
    const currentPath = [...pathNodes, nodeWithLevel];

    // If this is a BIS entity, record the path
    if (node.isBISEntity && node.bisEntity && depth > 0) {
      const path: OwnershipPath = {
        nodes: currentPath,
        edges: pathEdges,
        bisEntity: node.bisEntity,
        totalConfidence: currentConfidence,
        pathLength: depth,
        pathString: currentPath.map(n => n.name).join(' → '),
        riskLevel: this.calculatePathRiskLevel(currentConfidence, depth)
      };

      results.push(path);
    }

    // Continue searching through parent relationships
    const outgoingEdges = this.edges.filter(e =>
      this.normalizeName(e.from) === currentNode
    );

    for (const edge of outgoingEdges) {
      const nextNode = this.normalizeName(edge.to);

      // Skip if already visited (prevent cycles)
      if (visited.has(nextNode)) {
        continue;
      }

      // Calculate decayed confidence
      const decayedConfidence = currentConfidence * edge.confidence * this.CONFIDENCE_DECAY_RATE;

      // Skip if confidence too low
      if (decayedConfidence < 0.3) {
        continue;
      }

      // Recurse
      this.dfsSearch(
        nextNode,
        currentPath,
        [...pathEdges, edge],
        decayedConfidence,
        depth + 1,
        visited,
        results
      );
    }

    // Unmark visited (backtracking)
    visited.delete(currentNode);
  }

  /**
   * Calculate risk level based on confidence and path length
   */
  private calculatePathRiskLevel(
    confidence: number,
    pathLength: number
  ): 'critical' | 'high' | 'medium' | 'low' {
    // Direct connections (1 level) are most critical
    if (pathLength === 1 && confidence >= 0.9) {
      return 'critical';
    }

    // 2-level connections with high confidence
    if (pathLength === 2 && confidence >= 0.75) {
      return 'high';
    }

    // 3-level or medium confidence
    if (pathLength <= 3 && confidence >= 0.6) {
      return 'high';
    }

    // 4-5 level or lower confidence
    if (pathLength <= 5 && confidence >= 0.4) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Normalize company name for matching
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[.,\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\b(ltd|limited|inc|incorporated|corp|corporation|llc|co|company)\b/gi, '')
      .trim();
  }

  /**
   * Get summary statistics
   */
  public getGraphStats(): {
    totalNodes: number;
    totalEdges: number;
    bisNodes: number;
    maxDepth: number;
    averageConfidence: number;
  } {
    const bisNodes = Array.from(this.nodes.values()).filter(n => n.isBISEntity).length;
    const avgConfidence = this.edges.length > 0
      ? this.edges.reduce((sum, e) => sum + e.confidence, 0) / this.edges.length
      : 0;

    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      bisNodes,
      maxDepth: this.MAX_DEPTH,
      averageConfidence: avgConfidence
    };
  }

  /**
   * Find shortest path to any BIS entity
   */
  public findShortestPath(supplierName: string): OwnershipPath | null {
    const paths = this.findOwnershipPaths(supplierName);

    if (paths.length === 0) {
      return null;
    }

    // Sort by path length (shortest first), then by confidence (highest first)
    paths.sort((a, b) => {
      if (a.pathLength !== b.pathLength) {
        return a.pathLength - b.pathLength;
      }
      return b.totalConfidence - a.totalConfidence;
    });

    return paths[0];
  }

  /**
   * Find all critical paths (high confidence, short path)
   */
  public findCriticalPaths(supplierName: string): OwnershipPath[] {
    const paths = this.findOwnershipPaths(supplierName);

    return paths.filter(path =>
      path.riskLevel === 'critical' ||
      (path.riskLevel === 'high' && path.pathLength <= 2)
    );
  }

  /**
   * Export graph for visualization
   */
  public exportGraph(): {
    nodes: Array<{ id: string; label: string; isBIS: boolean; level: number }>;
    edges: Array<{ from: string; to: string; label: string; confidence: number }>;
  } {
    const nodes = Array.from(this.nodes.values()).map(node => ({
      id: node.normalizedName,
      label: node.name,
      isBIS: node.isBISEntity,
      level: node.level
    }));

    const edges = this.edges.map(edge => ({
      from: this.normalizeName(edge.from),
      to: this.normalizeName(edge.to),
      label: edge.relationshipType,
      confidence: edge.confidence
    }));

    return { nodes, edges };
  }
}

// Singleton
let ownershipGraphInstance: OwnershipGraphService | null = null;

export function getOwnershipGraph(): OwnershipGraphService {
  if (!ownershipGraphInstance) {
    ownershipGraphInstance = new OwnershipGraphService();
  }
  return ownershipGraphInstance;
}

export default OwnershipGraphService;
