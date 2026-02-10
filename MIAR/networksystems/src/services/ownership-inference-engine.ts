/**
 * OWNERSHIP INFERENCE ENGINE
 * Multiplies coverage through logical inference
 *
 * Key capabilities:
 * 1. Transitive closure: A→B→C implies A→C
 * 2. Sibling detection: A→B, A→C means B↔C affiliates
 * 3. Multi-level traversal: Find ultimate parent companies
 * 4. Confidence propagation: Lower confidence through inference chains
 *
 * This can DOUBLE effective coverage without new data sources!
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface OwnershipNode {
  entityName: string;
  directParent?: string;
  allParents: string[]; // Transitive parents
  children: string[]; // Direct subsidiaries
  allChildren: string[]; // Transitive subsidiaries
  siblings: string[]; // Entities with same parent
  level: number; // Distance from root
  ultimateParent?: string; // Top of ownership chain
}

export interface InferredRelationship {
  entity: string;
  relatedEntity: string;
  relationshipType: 'parent' | 'subsidiary' | 'sibling' | 'ultimate_parent';
  inferenceChain: string[]; // How we inferred this
  confidence: number;
  source: string;
}

export class OwnershipInferenceEngine {
  private ownershipGraph: Map<string, OwnershipNode> = new Map();

  /**
   * Build ownership graph from discovered relationships
   */
  public async buildGraph(): Promise<void> {
    console.log('📊 Building ownership graph...');

    const discovered = await prisma.discoveredOwnership.findMany();

    console.log(`   Loaded ${discovered.length} discovered relationships`);

    // Initialize nodes
    for (const rel of discovered) {
      if (!this.ownershipGraph.has(rel.entityName)) {
        this.ownershipGraph.set(rel.entityName, {
          entityName: rel.entityName,
          directParent: rel.parentCompany || undefined,
          allParents: [],
          children: [],
          allChildren: [],
          siblings: [],
          level: 0
        });
      }

      const node = this.ownershipGraph.get(rel.entityName)!;
      node.directParent = rel.parentCompany || undefined;

      // Add subsidiaries
      if (rel.subsidiaries) {
        try {
          const subs = JSON.parse(rel.subsidiaries);
          if (Array.isArray(subs)) {
            node.children.push(...subs);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      // Add affiliates as potential siblings
      if (rel.affiliates) {
        try {
          const affs = JSON.parse(rel.affiliates);
          if (Array.isArray(affs)) {
            node.siblings.push(...affs);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    console.log(`   Graph built with ${this.ownershipGraph.size} nodes`);
  }

  /**
   * Perform transitive closure: A→B→C implies A→C
   */
  public computeTransitiveClosure(): InferredRelationship[] {
    console.log('🔗 Computing transitive ownership closure...');

    const inferred: InferredRelationship[] = [];

    for (const [entityName, node] of this.ownershipGraph.entries()) {
      // Find all transitive parents (walk up the chain)
      const parents = this.findAllParents(entityName);
      node.allParents = parents;

      // Set ultimate parent (top of chain)
      if (parents.length > 0) {
        node.ultimateParent = parents[parents.length - 1];
        node.level = parents.length;
      }

      // For each transitive parent, create inferred relationship
      for (let i = 0; i < parents.length; i++) {
        const parent = parents[i];

        // Skip direct parent (not inferred)
        if (i === 0 && parent === node.directParent) {
          continue;
        }

        // Calculate confidence: decays by 10% per level
        const levelsAway = i + 1;
        const confidence = Math.max(0.5, 0.95 - (levelsAway * 0.1));

        inferred.push({
          entity: entityName,
          relatedEntity: parent,
          relationshipType: i === parents.length - 1 ? 'ultimate_parent' : 'parent',
          inferenceChain: this.buildChain(entityName, parent),
          confidence,
          source: 'Transitive Inference'
        });
      }

      // Find all transitive children (walk down the tree)
      const children = this.findAllChildren(entityName);
      node.allChildren = children;

      for (const child of children) {
        // Skip direct children
        if (node.children.includes(child)) {
          continue;
        }

        const levelsAway = this.calculateDistance(entityName, child);
        const confidence = Math.max(0.5, 0.95 - (levelsAway * 0.1));

        inferred.push({
          entity: entityName,
          relatedEntity: child,
          relationshipType: 'subsidiary',
          inferenceChain: this.buildChain(entityName, child),
          confidence,
          source: 'Transitive Inference'
        });
      }
    }

    console.log(`   ✅ Inferred ${inferred.length} transitive relationships`);
    return inferred;
  }

  /**
   * Find sibling entities (share same parent)
   */
  public detectSiblings(): InferredRelationship[] {
    console.log('👥 Detecting sibling entities...');

    const inferred: InferredRelationship[] = [];
    const parentToChildren = new Map<string, string[]>();

    // Group entities by parent
    for (const [entityName, node] of this.ownershipGraph.entries()) {
      if (node.directParent) {
        if (!parentToChildren.has(node.directParent)) {
          parentToChildren.set(node.directParent, []);
        }
        parentToChildren.get(node.directParent)!.push(entityName);
      }
    }

    // For each parent with multiple children, they're siblings
    for (const [parent, children] of parentToChildren.entries()) {
      if (children.length >= 2) {
        // Create sibling relationships for all pairs
        for (let i = 0; i < children.length; i++) {
          for (let j = i + 1; j < children.length; j++) {
            const entity1 = children[i];
            const entity2 = children[j];

            inferred.push({
              entity: entity1,
              relatedEntity: entity2,
              relationshipType: 'sibling',
              inferenceChain: [entity1, parent, entity2],
              confidence: 0.9,
              source: 'Sibling Inference'
            });

            // Reciprocal relationship
            inferred.push({
              entity: entity2,
              relatedEntity: entity1,
              relationshipType: 'sibling',
              inferenceChain: [entity2, parent, entity1],
              confidence: 0.9,
              source: 'Sibling Inference'
            });
          }
        }
      }
    }

    console.log(`   ✅ Detected ${inferred.length} sibling relationships`);
    return inferred;
  }

  /**
   * Find all parents up the ownership chain
   */
  private findAllParents(entityName: string, visited = new Set<string>()): string[] {
    if (visited.has(entityName)) {
      return []; // Circular reference protection
    }
    visited.add(entityName);

    const node = this.ownershipGraph.get(entityName);
    if (!node || !node.directParent) {
      return [];
    }

    const parents = [node.directParent];
    const grandparents = this.findAllParents(node.directParent, visited);
    parents.push(...grandparents);

    return parents;
  }

  /**
   * Find all children down the ownership tree
   */
  private findAllChildren(entityName: string, visited = new Set<string>()): string[] {
    if (visited.has(entityName)) {
      return []; // Circular reference protection
    }
    visited.add(entityName);

    const node = this.ownershipGraph.get(entityName);
    if (!node || node.children.length === 0) {
      return [];
    }

    const allChildren: string[] = [...node.children];

    for (const child of node.children) {
      const grandchildren = this.findAllChildren(child, visited);
      allChildren.push(...grandchildren);
    }

    return allChildren;
  }

  /**
   * Build inference chain showing how relationship was derived
   */
  private buildChain(from: string, to: string): string[] {
    const chain: string[] = [from];
    let current = from;

    // Walk up to find common ancestor
    while (current) {
      const node = this.ownershipGraph.get(current);
      if (!node || !node.directParent) break;

      chain.push(node.directParent);

      if (node.directParent === to) {
        return chain;
      }

      // Check if this parent leads to target
      if (this.hasPath(node.directParent, to)) {
        current = node.directParent;
      } else {
        break;
      }
    }

    return chain;
  }

  /**
   * Check if there's a path from source to target
   */
  private hasPath(from: string, to: string, visited = new Set<string>()): boolean {
    if (from === to) return true;
    if (visited.has(from)) return false;
    visited.add(from);

    const node = this.ownershipGraph.get(from);
    if (!node) return false;

    // Check children
    for (const child of node.children) {
      if (this.hasPath(child, to, visited)) {
        return true;
      }
    }

    // Check parent
    if (node.directParent && this.hasPath(node.directParent, to, visited)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate distance between two entities in the graph
   */
  private calculateDistance(from: string, to: string): number {
    const queue: Array<{node: string, dist: number}> = [{node: from, dist: 0}];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const {node, dist} = queue.shift()!;

      if (node === to) return dist;
      if (visited.has(node)) continue;
      visited.add(node);

      const nodeData = this.ownershipGraph.get(node);
      if (!nodeData) continue;

      // Check children
      for (const child of nodeData.children) {
        queue.push({node: child, dist: dist + 1});
      }

      // Check parent
      if (nodeData.directParent) {
        queue.push({node: nodeData.directParent, dist: dist + 1});
      }
    }

    return 999; // No path found
  }

  /**
   * Get enriched ownership data for an entity
   */
  public getEnrichedOwnership(entityName: string): OwnershipNode | null {
    return this.ownershipGraph.get(entityName) || null;
  }

  /**
   * Get statistics about inference
   */
  public getStats() {
    const stats = {
      totalNodes: this.ownershipGraph.size,
      nodesWithParents: 0,
      nodesWithChildren: 0,
      maxDepth: 0,
      ultimateParents: new Set<string>()
    };

    for (const node of this.ownershipGraph.values()) {
      if (node.directParent) stats.nodesWithParents++;
      if (node.children.length > 0) stats.nodesWithChildren++;
      if (node.level > stats.maxDepth) stats.maxDepth = node.level;
      if (node.ultimateParent) stats.ultimateParents.add(node.ultimateParent);
    }

    return {
      ...stats,
      uniqueParentCompanies: stats.ultimateParents.size
    };
  }
}

/**
 * Run full inference pipeline
 */
export async function runInferencePipeline(): Promise<{
  transitive: InferredRelationship[];
  siblings: InferredRelationship[];
  stats: any;
}> {
  const engine = new OwnershipInferenceEngine();

  await engine.buildGraph();
  const transitive = engine.computeTransitiveClosure();
  const siblings = engine.detectSiblings();
  const stats = engine.getStats();

  return { transitive, siblings, stats };
}

// Singleton
let inferenceEngineInstance: OwnershipInferenceEngine | null = null;

export function getInferenceEngine(): OwnershipInferenceEngine {
  if (!inferenceEngineInstance) {
    inferenceEngineInstance = new OwnershipInferenceEngine();
  }
  return inferenceEngineInstance;
}

export default OwnershipInferenceEngine;
