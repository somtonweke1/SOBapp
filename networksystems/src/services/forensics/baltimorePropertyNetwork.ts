/**
 * Baltimore Property Network Service
 * Transforms MIAR's network systems for Baltimore Real Estate
 * Replaces Mineral Nodes with Property Nodes
 * Replaces Trade Routes with Billing Tiers
 */

import { NetworkData } from '@/lib/network-science-algorithms';
import { PropertyLien, PropertyNode, LienNetworkEdge } from './lienMapping';
import { auditWaterBill, WaterBillAuditInput } from './dpwAuditor';

export interface BaltimorePropertyNode {
  id: string;
  address: string;
  ward?: string;
  section?: string;
  lastSale?: {
    date: string;
    amount: number;
  };
  position: { x: number; y: number; z: number };
  liens: PropertyLien[];
  totalLienAmount: number;
  lienCount: number;
  propertyType?: 'ROWHOUSE' | 'APARTMENT' | 'COMMERCIAL' | 'VACANT_LOT';
  // DPW Audit Results
  dpwAuditResult?: {
    hasError: boolean;
    discrepancyAmount: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  // Distress Score (based on Betweenness Centrality)
  distressScore: number;
  betweennessCentrality: number;
}

export interface BillingTierEdge {
  id: string;
  source: string; // Property ID
  target: string; // Billing Tier ID or another property
  type: 'BILLING_TIER' | 'SAME_BLOCK' | 'LIEN_CLUSTER';
  // Billing Tier specific data
  billingTier?: {
    tier: 1 | 2 | 3 | 4;
    ccfUsage: number;
    gallonsUsage: number;
    cost: number;
  };
  // CCF to Gallon conversion
  ccfToGallons: number; // 1 CCF = 748 gallons
  weight: number;
}

/**
 * Calculate Betweenness Centrality for properties based on water liens
 * Properties with high betweenness are "bridge" properties connecting different blocks/clusters
 * Higher betweenness = higher distress score (more central to distressed network)
 * 
 * Simplified implementation: Count shortest paths through each node
 */
export const calculateBetweennessCentrality = (
  nodes: PropertyNode[],
  edges: LienNetworkEdge[]
): Map<string, number> => {
  const betweenness = new Map<string, number>();
  nodes.forEach(node => betweenness.set(node.id, 0));

  // Build adjacency list
  const adjacencyList: Record<string, string[]> = {};
  nodes.forEach(node => {
    adjacencyList[node.id] = [];
  });
  edges.forEach(edge => {
    if (!adjacencyList[edge.source].includes(edge.target)) {
      adjacencyList[edge.source].push(edge.target);
    }
    if (!adjacencyList[edge.target].includes(edge.source)) {
      adjacencyList[edge.target].push(edge.source);
    }
  });

  // Calculate shortest paths between all pairs using BFS
  nodes.forEach(startNode => {
    // BFS from startNode
    const distances = new Map<string, number>();
    const predecessors = new Map<string, string[]>();
    const queue: string[] = [startNode.id];
    distances.set(startNode.id, 0);
    predecessors.set(startNode.id, []);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDist = distances.get(current)!;

      (adjacencyList[current] || []).forEach(neighbor => {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, currentDist + 1);
          predecessors.set(neighbor, [current]);
          queue.push(neighbor);
        } else if (distances.get(neighbor) === currentDist + 1) {
          // Multiple shortest paths
          predecessors.get(neighbor)!.push(current);
        }
      });
    }

    // Count paths through each intermediate node
    nodes.forEach(node => {
      if (node.id !== startNode.id && distances.has(node.id)) {
        const pathCount = countShortestPaths(node.id, startNode.id, predecessors, distances);
        betweenness.set(
          node.id,
          (betweenness.get(node.id) || 0) + pathCount
        );
      }
    });
  });

  // Normalize by number of pairs (n*(n-1) for undirected graph)
  const pairCount = nodes.length > 1 ? nodes.length * (nodes.length - 1) : 1;
  betweenness.forEach((value, key) => {
    betweenness.set(key, value / pairCount);
  });

  return betweenness;
};

/**
 * Count shortest paths through a node
 */
function countShortestPaths(
  intermediate: string,
  start: string,
  predecessors: Map<string, string[]>,
  distances: Map<string, number>
): number {
  if (intermediate === start) return 0;
  
  const preds = predecessors.get(intermediate) || [];
  if (preds.length === 0) return 0;

  // If this node is on shortest path from start to any target
  let count = 0;
  predecessors.forEach((preds, target) => {
    if (target !== start && preds.includes(intermediate)) {
      count += 1;
    }
  });

  return count;
}

/**
 * Calculate Distress Score based on Betweenness Centrality
 * Higher betweenness = more central to distressed network = higher distress score
 */
export const calculateDistressScore = (
  betweennessCentrality: number,
  lienCount: number,
  totalLienAmount: number,
  maxBetweenness: number
): number => {
  // Normalize betweenness (0-1)
  const normalizedBetweenness = maxBetweenness > 0 ? betweennessCentrality / maxBetweenness : 0;

  // Factor in lien count (more liens = more distressed)
  const lienFactor = Math.min(1, lienCount / 5); // Max at 5+ liens

  // Factor in lien amount (higher amount = more distressed)
  const amountFactor = Math.min(1, totalLienAmount / 10000); // Max at $10k+ liens

  // Distress score: weighted combination
  // Betweenness centrality is most important (50%), then lien count (30%), then amount (20%)
  const distressScore = (
    normalizedBetweenness * 0.5 +
    lienFactor * 0.3 +
    amountFactor * 0.2
  ) * 100; // Scale to 0-100

  return Math.min(100, Math.max(0, distressScore));
};

/**
 * Convert CCF to Gallons
 */
export const ccfToGallons = (ccf: number): number => {
  return ccf * 748; // 1 CCF = 748 gallons
};

/**
 * Convert Gallons to CCF
 */
export const gallonsToCCF = (gallons: number): number => {
  return gallons / 748;
};

/**
 * Determine billing tier from usage (gallons)
 */
export const getBillingTier = (gallons: number): {
  tier: 1 | 2 | 3 | 4;
  gallonsInTier: number;
  cost: number;
} => {
  if (gallons <= 2000) {
    return {
      tier: 1,
      gallonsInTier: gallons,
      cost: gallons * 0.012,
    };
  } else if (gallons <= 10000) {
    const tier1Cost = 2000 * 0.012;
    const tier2Gallons = gallons - 2000;
    return {
      tier: 2,
      gallonsInTier: tier2Gallons,
      cost: tier1Cost + (tier2Gallons * 0.014),
    };
  } else if (gallons <= 20000) {
    const tier1Cost = 2000 * 0.012;
    const tier2Cost = 8000 * 0.014;
    const tier3Gallons = gallons - 10000;
    return {
      tier: 3,
      gallonsInTier: tier3Gallons,
      cost: tier1Cost + tier2Cost + (tier3Gallons * 0.016),
    };
  } else {
    const tier1Cost = 2000 * 0.012;
    const tier2Cost = 8000 * 0.014;
    const tier3Cost = 10000 * 0.016;
    const tier4Gallons = gallons - 20000;
    return {
      tier: 4,
      gallonsInTier: tier4Gallons,
      cost: tier1Cost + tier2Cost + tier3Cost + (tier4Gallons * 0.018),
    };
  }
};

/**
 * Build Baltimore Property Network
 * Transforms property data into network structure with billing tiers
 */
export const buildBaltimorePropertyNetwork = async (
  properties: Array<{
    id: string;
    address: string;
    ward?: string;
    section?: string;
    lastSale?: { date: string; amount: number };
    liens: PropertyLien[];
    // Optional: DPW bill data for audit
    dpwBillData?: {
      meterReadCurrent: number;
      meterReadLast: number;
      totalBill: number;
      serviceCharge?: number;
      sewerCharge?: number;
    };
    position: { x: number; y: number; z: number };
  }>
): Promise<{
  nodes: BaltimorePropertyNode[];
  edges: BillingTierEdge[];
  network: NetworkData;
}> => {
  // Convert to PropertyNode format for lien mapping
  const propertyNodes: PropertyNode[] = properties.map(prop => ({
    id: prop.id,
    label: prop.address,
    address: prop.address,
    zipCode: prop.liens[0]?.zipCode || '',
    position: prop.position,
    liens: prop.liens,
    totalLienAmount: prop.liens.reduce((sum, lien) => sum + lien.lienAmount, 0),
    lienCount: prop.liens.filter(l => l.status === 'ACTIVE').length,
  }));

  // Build lien network edges
  const lienEdges: LienNetworkEdge[] = [];
  const blockMap = new Map<string, PropertyNode[]>();
  propertyNodes.forEach(node => {
    const block = node.liens[0]?.block;
    if (block) {
      if (!blockMap.has(block)) {
        blockMap.set(block, []);
      }
      blockMap.get(block)!.push(node);
    }
  });

  blockMap.forEach((blockProperties) => {
    for (let i = 0; i < blockProperties.length; i++) {
      for (let j = i + 1; j < blockProperties.length; j++) {
        lienEdges.push({
          source: blockProperties[i].id,
          target: blockProperties[j].id,
          type: 'SAME_BLOCK',
          weight: 1.0,
          metadata: { sharedBlock: blockProperties[i].liens[0]?.block },
        });
      }
    }
  });

  // Calculate betweenness centrality
  const betweenness = calculateBetweennessCentrality(propertyNodes, lienEdges);
  const maxBetweenness = Math.max(...Array.from(betweenness.values()), 1);

  // Build Baltimore Property Nodes with distress scores
  const baltimoreNodes: BaltimorePropertyNode[] = properties.map(prop => {
    const propertyNode = propertyNodes.find(p => p.id === prop.id)!;
    const bc = betweenness.get(prop.id) || 0;
    const distressScore = calculateDistressScore(
      bc,
      propertyNode.lienCount,
      propertyNode.totalLienAmount,
      maxBetweenness
    );

    // Perform DPW audit if bill data provided
    let dpwAuditResult;
    if (prop.dpwBillData) {
      const auditInput: WaterBillAuditInput = {
        meterReadCurrent: prop.dpwBillData.meterReadCurrent,
        meterReadLast: prop.dpwBillData.meterReadLast,
        totalBill: prop.dpwBillData.totalBill,
        serviceCharge: prop.dpwBillData.serviceCharge,
        sewerCharge: prop.dpwBillData.sewerCharge,
      };
      const audit = auditWaterBill(auditInput);
      dpwAuditResult = {
        hasError: audit.isError,
        discrepancyAmount: parseFloat(audit.discrepancyAmount),
        severity: audit.severity,
      };
    }

    return {
      id: prop.id,
      address: prop.address,
      ward: prop.ward,
      section: prop.section,
      lastSale: prop.lastSale,
      position: prop.position,
      liens: prop.liens,
      totalLienAmount: propertyNode.totalLienAmount,
      lienCount: propertyNode.lienCount,
      propertyType: inferPropertyType(prop.address),
      dpwAuditResult,
      distressScore,
      betweennessCentrality: bc,
    };
  });

  // Build billing tier edges
  const billingTierEdges: BillingTierEdge[] = [];
  
  // Group properties by billing tier (based on water usage if available)
  baltimoreNodes.forEach(node => {
    // If we have DPW audit data, use actual usage
    if (node.dpwAuditResult) {
      // Estimate usage from audit (simplified - would need actual meter data)
      const estimatedCCF = 25; // Placeholder
      const estimatedGallons = ccfToGallons(estimatedCCF);
      const billingTier = getBillingTier(estimatedGallons);

      billingTierEdges.push({
        id: `billing-${node.id}`,
        source: node.id,
        target: `tier-${billingTier.tier}`,
        type: 'BILLING_TIER',
        billingTier: {
          tier: billingTier.tier,
          ccfUsage: estimatedCCF,
          gallonsUsage: estimatedGallons,
          cost: billingTier.cost,
        },
        ccfToGallons: 748,
        weight: billingTier.tier, // Higher tier = higher weight
      });
    }

    // Add same-block connections
    const block = node.liens[0]?.block;
    if (block) {
      const blockProperties = baltimoreNodes.filter(n => n.liens[0]?.block === block);
      blockProperties.forEach(otherNode => {
        if (otherNode.id !== node.id) {
          billingTierEdges.push({
            id: `block-${node.id}-${otherNode.id}`,
            source: node.id,
            target: otherNode.id,
            type: 'SAME_BLOCK',
            ccfToGallons: 748,
            weight: 1.0,
          });
        }
      });
    }
  });

  // Build network data structure
  const network: NetworkData = {
    nodes: baltimoreNodes.map(node => ({
      ...node,
      label: node.address,
    })),
    edges: billingTierEdges.map(edge => ({
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
    })),
    directed: false,
  };

  return {
    nodes: baltimoreNodes,
    edges: billingTierEdges,
    network,
  };
};

/**
 * Infer property type from address
 */
function inferPropertyType(address: string): 'ROWHOUSE' | 'APARTMENT' | 'COMMERCIAL' | 'VACANT_LOT' {
  const addrLower = address.toLowerCase();
  if (addrLower.includes('apt') || addrLower.includes('apartment') || addrLower.includes('unit')) {
    return 'APARTMENT';
  }
  if (addrLower.includes('lot') || addrLower.includes('vacant')) {
    return 'VACANT_LOT';
  }
  if (addrLower.includes('st') || addrLower.includes('ave') || addrLower.includes('rd')) {
    return 'ROWHOUSE';
  }
  return 'COMMERCIAL';
}
