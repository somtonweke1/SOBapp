
/**
 * Baltimore Property Lien Mapping Service
 * Maps DPW liens, tax liens, and property relationships for network visualization
 * Transforms MIAR's network intelligence for urban real estate forensics
 */

export interface PropertyLien {
  propertyId: string;
  address: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  lienType: 'DPW_WATER' | 'DPW_SEWER' | 'TAX' | 'HOA' | 'OTHER';
  lienAmount: number;
  lienDate: string; // ISO date string
  status: 'ACTIVE' | 'SATISFIED' | 'RELEASED';
  block?: string;
  lot?: string;
}

export interface PropertyNode {
  id: string;
  label: string;
  address: string;
  zipCode: string;
  position: { x: number; y: number; z: number };
  liens: PropertyLien[];
  totalLienAmount: number;
  lienCount: number;
  propertyType?: 'ROWHOUSE' | 'APARTMENT' | 'COMMERCIAL' | 'VACANT_LOT';
}

export interface LienNetworkEdge {
  source: string; // Property ID
  target: string; // Property ID or cluster ID
  type: 'SAME_BLOCK' | 'SAME_OWNER' | 'CLUSTER' | 'DISTRESS_SIGNAL';
  weight: number; // Strength of connection
  metadata?: {
    sharedBlock?: string;
    sharedOwner?: string;
    clusterId?: string;
  };
}

export interface LienCluster {
  clusterId: string;
  properties: PropertyNode[];
  totalLienAmount: number;
  averageLienAmount: number;
  zipCode: string;
  block?: string;
  clusterType: 'DISTRESSED_BLOCK' | 'OWNER_PORTFOLIO' | 'GEOGRAPHIC_CLUSTER';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Build property network from liens
 * Creates nodes (properties) and edges (relationships) for 3D visualization
 */
export const buildLienNetwork = (
  liens: PropertyLien[]
): {
  nodes: PropertyNode[];
  edges: LienNetworkEdge[];
  clusters: LienCluster[];
} => {
  // Group liens by property
  const propertyMap = new Map<string, PropertyLien[]>();
  liens.forEach(lien => {
    if (!propertyMap.has(lien.propertyId)) {
      propertyMap.set(lien.propertyId, []);
    }
    propertyMap.get(lien.propertyId)!.push(lien);
  });

  // Create property nodes
  const nodes: PropertyNode[] = Array.from(propertyMap.entries()).map(([propertyId, propertyLiens]) => {
    const firstLien = propertyLiens[0];
    const totalLienAmount = propertyLiens.reduce((sum, lien) => sum + lien.lienAmount, 0);
    const activeLiens = propertyLiens.filter(l => l.status === 'ACTIVE');

    // Generate position (use zip code as base, add randomness for visualization)
    const zipCodeHash = firstLien.zipCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const x = (zipCodeHash % 100) - 50; // -50 to 50
    const y = activeLiens.length * 2; // Height based on lien count
    const z = ((zipCodeHash * 7) % 100) - 50; // -50 to 50

    return {
      id: propertyId,
      label: firstLien.address,
      address: firstLien.address,
      zipCode: firstLien.zipCode,
      position: { x, y, z },
      liens: propertyLiens,
      totalLienAmount,
      lienCount: activeLiens.length,
      propertyType: inferPropertyType(firstLien.address),
    };
  });

  // Create edges based on relationships
  const edges: LienNetworkEdge[] = [];
  const processedPairs = new Set<string>();

  // Same block connections
  const blockMap = new Map<string, PropertyNode[]>();
  nodes.forEach(node => {
    const block = node.liens[0]?.block;
    if (block) {
      if (!blockMap.has(block)) {
        blockMap.set(block, []);
      }
      blockMap.get(block)!.push(node);
    }
  });

  blockMap.forEach((properties, block) => {
    if (properties.length > 1) {
      // Connect all properties on same block
      for (let i = 0; i < properties.length; i++) {
        for (let j = i + 1; j < properties.length; j++) {
          const pairKey = [properties[i].id, properties[j].id].sort().join('-');
          if (!processedPairs.has(pairKey)) {
            edges.push({
              source: properties[i].id,
              target: properties[j].id,
              type: 'SAME_BLOCK',
              weight: 1.0,
              metadata: { sharedBlock: block },
            });
            processedPairs.add(pairKey);
          }
        }
      }
    }
  });

  // Geographic clustering (zip code clusters)
  const zipCodeMap = new Map<string, PropertyNode[]>();
  nodes.forEach(node => {
    if (!zipCodeMap.has(node.zipCode)) {
      zipCodeMap.set(node.zipCode, []);
    }
    zipCodeMap.get(node.zipCode)!.push(node);
  });

  // Create clusters
  const clusters: LienCluster[] = [];
  zipCodeMap.forEach((properties, zipCode) => {
    if (properties.length >= 3) {
      // Only create clusters for zip codes with 3+ properties
      const totalLienAmount = properties.reduce((sum, p) => sum + p.totalLienAmount, 0);
      const averageLienAmount = totalLienAmount / properties.length;
      const highLienCount = properties.filter(p => p.lienCount >= 2).length;

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (highLienCount >= properties.length * 0.5) {
        riskLevel = 'CRITICAL';
      } else if (highLienCount >= properties.length * 0.3) {
        riskLevel = 'HIGH';
      } else if (highLienCount >= properties.length * 0.15) {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'LOW';
      }

      clusters.push({
        clusterId: `zip-${zipCode}`,
        properties,
        totalLienAmount,
        averageLienAmount,
        zipCode,
        clusterType: 'GEOGRAPHIC_CLUSTER',
        riskLevel,
      });
    }
  });

  // Distressed block clusters (blocks with high lien density)
  blockMap.forEach((properties, block) => {
    if (properties.length >= 5) {
      const highLienProperties = properties.filter(p => p.lienCount >= 2);
      if (highLienProperties.length >= 3) {
        const totalLienAmount = properties.reduce((sum, p) => sum + p.totalLienAmount, 0);
        const averageLienAmount = totalLienAmount / properties.length;

        clusters.push({
          clusterId: `block-${block}`,
          properties,
          totalLienAmount,
          averageLienAmount,
          zipCode: properties[0].zipCode,
          block,
          clusterType: 'DISTRESSED_BLOCK',
          riskLevel: 'HIGH',
        });
      }
    }
  });

  return { nodes, edges, clusters };
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

/**
 * Calculate centrality metrics for properties
 * Identifies "power properties" - those with most connections/cluster influence
 */
export const calculatePropertyCentrality = (
  nodes: PropertyNode[],
  edges: LienNetworkEdge[]
): Map<string, {
  degree: number;
  betweenness: number;
  clusterInfluence: number;
}> => {
  const centrality = new Map<string, { degree: number; betweenness: number; clusterInfluence: number }>();

  // Calculate degree centrality (number of connections)
  const degreeMap = new Map<string, number>();
  nodes.forEach(node => degreeMap.set(node.id, 0));
  edges.forEach(edge => {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
  });

  // Calculate cluster influence (properties in multiple clusters)
  const clusterInfluenceMap = new Map<string, number>();
  nodes.forEach(node => {
    const connections = edges.filter(e => e.source === node.id || e.target === node.id);
    clusterInfluenceMap.set(node.id, connections.length);
  });

  // Simplified betweenness (based on edge count)
  nodes.forEach(node => {
    const degree = degreeMap.get(node.id) || 0;
    const clusterInfluence = clusterInfluenceMap.get(node.id) || 0;
    const betweenness = degree * 0.5; // Simplified calculation

    centrality.set(node.id, {
      degree,
      betweenness,
      clusterInfluence,
    });
  });

  return centrality;
};

/**
 * Find distressed deal opportunities
 * Properties with liens that signal potential distressed sales
 */
export const findDistressedOpportunities = (
  nodes: PropertyNode[],
  clusters: LienCluster[]
): Array<{
  property: PropertyNode;
  opportunityScore: number;
  reasons: string[];
}> => {
  const opportunities: Array<{
    property: PropertyNode;
    opportunityScore: number;
    reasons: string[];
  }> = [];

  nodes.forEach(property => {
    const reasons: string[] = [];
    let score = 0;

    // High lien amount relative to property value (estimated)
    if (property.totalLienAmount > 5000) {
      reasons.push(`High lien amount: $${property.totalLienAmount.toLocaleString()}`);
      score += 30;
    }

    // Multiple active liens
    if (property.lienCount >= 2) {
      reasons.push(`Multiple active liens: ${property.lienCount}`);
      score += 25;
    }

    // In distressed block cluster
    const inDistressedBlock = clusters.some(
      c => c.clusterType === 'DISTRESSED_BLOCK' && c.properties.some(p => p.id === property.id)
    );
    if (inDistressedBlock) {
      reasons.push('Located in distressed block cluster');
      score += 20;
    }

    // High lien zip code
    const zipCluster = clusters.find(c => c.zipCode === property.zipCode && c.clusterType === 'GEOGRAPHIC_CLUSTER');
    if (zipCluster && zipCluster.riskLevel === 'HIGH' || zipCluster?.riskLevel === 'CRITICAL') {
      reasons.push(`High-risk zip code cluster: ${property.zipCode}`);
      score += 15;
    }

    if (score > 0) {
      opportunities.push({
        property,
        opportunityScore: score,
        reasons,
      });
    }
  });

  return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
};

