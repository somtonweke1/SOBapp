#!/usr/bin/env tsx
/**
 * RUN OWNERSHIP INFERENCE
 * Multiplies coverage through logical inference
 */

import { runInferencePipeline } from '../src/services/ownership-inference-engine';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 OWNERSHIP INFERENCE PIPELINE\n');
  console.log('━'.repeat(60));
  console.log('Multiplying coverage through logical inference');
  console.log('━'.repeat(60) + '\n');

  // Get baseline coverage
  const baselineCount = await prisma.discoveredOwnership.count();
  console.log(`📊 Baseline: ${baselineCount} discovered relationships\n`);

  // Run inference
  const result = await runInferencePipeline();

  console.log('\n' + '━'.repeat(60));
  console.log('✅ INFERENCE COMPLETE!');
  console.log('━'.repeat(60));
  console.log(`📊 Results:`);
  console.log(`   Transitive relationships: ${result.transitive.length}`);
  console.log(`   Sibling relationships: ${result.siblings.length}`);
  console.log(`   Total inferred: ${result.transitive.length + result.siblings.length}`);
  console.log(``);
  console.log(`📈 Graph Statistics:`);
  console.log(`   Total entities in graph: ${result.stats.totalNodes}`);
  console.log(`   Entities with parents: ${result.stats.nodesWithParents}`);
  console.log(`   Entities with children: ${result.stats.nodesWithChildren}`);
  console.log(`   Maximum ownership depth: ${result.stats.maxDepth} levels`);
  console.log(`   Unique ultimate parents: ${result.stats.uniqueParentCompanies}`);
  console.log(``);

  // Calculate effective coverage
  const totalKnownEntities = new Set<string>();

  // Add baseline entities
  const baseline = await prisma.discoveredOwnership.findMany({
    select: { entityName: true }
  });
  baseline.forEach(e => totalKnownEntities.add(e.entityName));

  // Add inferred entities
  result.transitive.forEach(r => {
    totalKnownEntities.add(r.entity);
    totalKnownEntities.add(r.relatedEntity);
  });
  result.siblings.forEach(r => {
    totalKnownEntities.add(r.entity);
    totalKnownEntities.add(r.relatedEntity);
  });

  const effectiveCoverage = (totalKnownEntities.size / 3421 * 100).toFixed(1);

  console.log(`🎯 EFFECTIVE COVERAGE:`);
  console.log(`   Direct discoveries: ${baselineCount} (${(baselineCount/3421*100).toFixed(1)}%)`);
  console.log(`   With inference: ${totalKnownEntities.size} (${effectiveCoverage}%)`);
  console.log(`   Coverage multiplier: ${(totalKnownEntities.size / baselineCount).toFixed(2)}x`);
  console.log('━'.repeat(60) + '\n');

  // Show sample inferred relationships
  console.log('📋 Sample Inferred Relationships:\n');

  // Show top 10 transitive
  console.log('   Transitive (A→B→C):');
  result.transitive.slice(0, 10).forEach(r => {
    const chain = r.inferenceChain.join(' → ');
    console.log(`      ${r.entity} ⇒ ${r.relatedEntity}`);
    console.log(`         Chain: ${chain}`);
    console.log(`         Confidence: ${(r.confidence * 100).toFixed(0)}%\n`);
  });

  // Show top 10 siblings
  if (result.siblings.length > 0) {
    console.log('   Siblings (share same parent):');
    result.siblings.slice(0, 10).forEach(r => {
      const chain = r.inferenceChain.join(' ← ');
      console.log(`      ${r.entity} ↔ ${r.relatedEntity}`);
      console.log(`         Via: ${chain}`);
      console.log(`         Confidence: ${(r.confidence * 100).toFixed(0)}%\n`);
    });
  }

  // Save inference results to a JSON file for inspection
  const fs = require('fs');
  const outputPath = 'data/inference-results.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    transitive: result.transitive.slice(0, 100), // Save first 100
    siblings: result.siblings.slice(0, 100),
    stats: result.stats,
    effectiveCoverage: {
      baseline: baselineCount,
      withInference: totalKnownEntities.size,
      coveragePercent: parseFloat(effectiveCoverage),
      multiplier: totalKnownEntities.size / baselineCount
    }
  }, null, 2));

  console.log(`💾 Full results saved to: ${outputPath}\n`);

  process.exit(0);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
