#!/usr/bin/env tsx
/**
 * RUN OWNERSHIP DISCOVERY - CLI Script
 * Executes the comprehensive ownership discovery pipeline
 * Usage: npx tsx scripts/run-ownership-discovery.ts [--limit=100] [--parallel=5]
 */

import { getOwnershipDiscoveryPipeline } from '../src/services/ownership-discovery-pipeline';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 OWNERSHIP DISCOVERY PIPELINE\n');
  console.log('━'.repeat(60));
  console.log('Starting comprehensive ownership discovery...');
  console.log('This will discover ownership for ALL 3,421 BIS entities');
  console.log('━'.repeat(60) + '\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1];
  const parallel = args.find(arg => arg.startsWith('--parallel='))?.split('=')[1];

  const options = {
    limit: limit ? parseInt(limit) : undefined,
    parallelism: parallel ? parseInt(parallel) : 3,
    continueFromLast: true
  };

  console.log('⚙️  Configuration:');
  console.log(`   Limit: ${options.limit || 'None (all entities)'}`);
  console.log(`   Parallelism: ${options.parallelism} concurrent requests`);
  console.log(`   Continue from last: ${options.continueFromLast}`);
  console.log('');

  // Create discovery job in database
  const job = await prisma.discoveryJob.create({
    data: {
      status: 'running',
      type: 'full_discovery',
      totalEntities: options.limit || 3421
    }
  });

  console.log(`📝 Job ID: ${job.id}\n`);

  try {
    // Run discovery pipeline
    const pipeline = getOwnershipDiscoveryPipeline();
    const result = await pipeline.discoverAll(options);

    // Update job with results
    await prisma.discoveryJob.update({
      where: { id: job.id },
      data: {
        status: 'completed',
        processedEntities: result.processed,
        discoveredCount: result.discovered,
        failedCount: result.failed,
        coveragePercent: result.coveragePercent,
        results: JSON.stringify(result),
        completedAt: new Date()
      }
    });

    console.log('\n' + '━'.repeat(60));
    console.log('✅ DISCOVERY COMPLETE!');
    console.log('━'.repeat(60));
    console.log(`📊 Results:`);
    console.log(`   Total Processed: ${result.processed}`);
    console.log(`   Discovered: ${result.discovered}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Coverage: ${result.coveragePercent.toFixed(1)}%`);
    console.log(`   Job ID: ${job.id}`);
    console.log('━'.repeat(60) + '\n');

    // Show next steps
    if (result.coveragePercent < 90) {
      console.log('📋 Next Steps to Reach 90%+:');
      console.log('   1. Add more data sources (corporate registries)');
      console.log('   2. Implement web scraping for China SAIC');
      console.log('   3. Add manual verification for high-value entities');
      console.log('   4. Run incremental updates daily');
      console.log('');
    } else {
      console.log('🎉 Target reached! 90%+ coverage achieved!');
      console.log('');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Discovery failed:', error);

    // Update job with error
    await prisma.discoveryJob.update({
      where: { id: job.id },
      data: {
        status: 'failed',
        errors: JSON.stringify([error instanceof Error ? error.message : String(error)]),
        completedAt: new Date()
      }
    });

    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
