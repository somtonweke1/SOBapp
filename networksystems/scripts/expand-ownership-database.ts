#!/usr/bin/env tsx
/**
 * OWNERSHIP DATABASE EXPANSION SCRIPT
 * Expands from 182 manual relationships to 1,000+ automated discoveries
 *
 * Usage: npx tsx scripts/expand-ownership-database.ts
 */

import fs from 'fs';
import path from 'path';

async function main() {
  console.log('='.repeat(70));
  console.log('  AUTOMATED OWNERSHIP DATABASE EXPANSION');
  console.log('  From 182 manual → 1,000+ automated discoveries');
  console.log('='.repeat(70));
  console.log();

  // Load BIS entities
  console.log('[1/4] Loading BIS entities...');
  const bisDataPath = path.join(process.cwd(), 'data', 'bis', 'entity-list-current.json');

  if (!fs.existsSync(bisDataPath)) {
    console.error(`❌ BIS data not found at: ${bisDataPath}`);
    console.error('Run: npx tsx scripts/scrape-bis-entities.ts');
    process.exit(1);
  }

  const bisData = JSON.parse(fs.readFileSync(bisDataPath, 'utf-8'));
  const entities = bisData.entities || [];

  console.log(`✓ Loaded ${entities.length} BIS entities`);
  console.log();

  // Run automated discovery
  console.log('[2/4] Running automated ownership discovery...');
  console.log('Methods: Pattern matching, Name analysis, Geographic clustering, Wikidata');
  console.log('Estimated time: 3-5 minutes for full dataset');
  console.log();

  const { getOwnershipExpansionService } = await import('../src/services/automated-ownership-expansion');
  const discoveryService = getOwnershipExpansionService();

  const discovered = await discoveryService.discoverOwnershipRelationships(entities);

  console.log();
  console.log('='.repeat(70));
  console.log('  DISCOVERY RESULTS');
  console.log('='.repeat(70));

  const stats = discoveryService.getDiscoveryStats();

  console.log();
  console.log(`Total Discovered: ${stats.totalRelationships.toLocaleString()} relationships`);
  console.log();
  console.log('By Discovery Method:');
  const methodWidth = Math.max(...Object.keys(stats.bySource).map(s => s.length));
  for (const [method, count] of Object.entries(stats.bySource).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.floor((count / stats.totalRelationships) * 40));
    console.log(`  ${method.padEnd(methodWidth + 2)}: ${String(count).padStart(5)} ${bar}`);
  }
  console.log();
  console.log('By Confidence Level:');
  console.log(`  High   (0.8-1.0): ${stats.byConfidence.high.toLocaleString()}`);
  console.log(`  Medium (0.5-0.8): ${stats.byConfidence.medium.toLocaleString()}`);
  console.log(`  Low    (0.3-0.5): ${stats.byConfidence.low.toLocaleString()}`);
  console.log();

  // Export JSON
  console.log('[3/4] Exporting discovered relationships...');
  const outputPath = path.join(process.cwd(), 'data', 'discovered-ownership-relationships.json');
  const outputData = {
    metadata: {
      totalRelationships: stats.totalRelationships,
      generatedAt: new Date().toISOString(),
      bisEntitiesProcessed: entities.length,
      stats,
      methods: ['pattern_matching', 'name_analysis', 'geographic_clustering', 'wikidata']
    },
    relationships: discovered.map(r => ({
      parent: r.parent,
      subsidiary: r.subsidiary,
      confidence: r.confidence,
      source: r.source,
      evidence: r.evidence
    }))
  };

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`✓ Exported JSON: ${outputPath}`);

  // Generate TypeScript code
  console.log('[4/4] Generating TypeScript integration code...');

  const tsCode = generateTypeScriptCode(discovered, stats);
  const tsOutputPath = path.join(process.cwd(), 'src', 'data', 'auto-discovered-relationships.ts');

  fs.writeFileSync(tsOutputPath, tsCode);
  console.log(`✓ Generated TS:  ${tsOutputPath}`);

  console.log();
  console.log('='.repeat(70));
  console.log('  SUCCESS ✓');
  console.log('='.repeat(70));
  console.log();
  console.log('Next Steps:');
  console.log('1. Import AUTO_DISCOVERED_RELATIONSHIPS in bis-ownership-database.ts');
  console.log('2. Merge with manual relationships (182 + auto)');
  console.log('3. Update scanner to use combined dataset');
  console.log('4. Test with sample supplier list');
  console.log();
  console.log(`Coverage improvement: 182 → ${stats.totalRelationships} (+${(((stats.totalRelationships - 182) / 182) * 100).toFixed(0)}%)`);
  console.log();
}

function generateTypeScriptCode(relationships: any[], stats: any): string {
  // Group by parent
  const grouped: Record<string, Set<string>> = {};

  for (const rel of relationships) {
    if (!grouped[rel.parent]) {
      grouped[rel.parent] = new Set();
    }
    grouped[rel.parent].add(rel.subsidiary);
  }

  const sortedParents = Object.keys(grouped).sort();

  let code = `/**
 * AUTO-DISCOVERED OWNERSHIP RELATIONSHIPS
 *
 * Generated: ${new Date().toISOString()}
 * Total Relationships: ${stats.totalRelationships.toLocaleString()}
 * Total Parents: ${Object.keys(grouped).length}
 * Confidence Distribution:
 *   - High   (0.8-1.0): ${stats.byConfidence.high}
 *   - Medium (0.5-0.8): ${stats.byConfidence.medium}
 *   - Low    (0.3-0.5): ${stats.byConfidence.low}
 *
 * Discovery Methods:
${Object.entries(stats.bySource).map(([method, count]) => ` *   - ${method}: ${count}`).join('\n')}
 *
 * DO NOT EDIT MANUALLY
 * Regenerate: npx tsx scripts/expand-ownership-database.ts
 */

export interface AutoDiscoveredRelationships {
  subsidiaries: Record<string, string[]>;
  metadata: {
    totalRelationships: number;
    totalParents: number;
    generatedAt: string;
    confidenceDistribution: {
      high: number;
      medium: number;
      low: number;
    };
  };
}

export const AUTO_DISCOVERED_RELATIONSHIPS: AutoDiscoveredRelationships = {
  subsidiaries: {
`;

  // Add top 100 parents to keep file size manageable
  const topParents = sortedParents.slice(0, 100);

  for (const parent of topParents) {
    const subsidiaries = Array.from(grouped[parent]).sort().slice(0, 50); // Max 50 subs per parent
    const escapedParent = parent.replace(/'/g, "\\'").replace(/\n/g, ' ');

    code += `    '${escapedParent}': [\n`;
    for (const subsidiary of subsidiaries) {
      const escapedSubsidiary = subsidiary.replace(/'/g, "\\'").replace(/\n/g, ' ');
      code += `      '${escapedSubsidiary}',\n`;
    }
    code += `    ],\n\n`;
  }

  code += `  },
  metadata: {
    totalRelationships: ${stats.totalRelationships},
    totalParents: ${Object.keys(grouped).length},
    generatedAt: '${new Date().toISOString()}',
    confidenceDistribution: {
      high: ${stats.byConfidence.high},
      medium: ${stats.byConfidence.medium},
      low: ${stats.byConfidence.low}
    }
  }
};
`;

  return code;
}

// Run
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
