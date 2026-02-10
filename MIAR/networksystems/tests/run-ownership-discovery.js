/**
 * Run Automated Ownership Discovery Pipeline
 * This builds the complete ownership database
 */

async function runOwnershipDiscovery() {
  console.log('🚀 AUTOMATED OWNERSHIP DISCOVERY\n');
  console.log('This will:');
  console.log('1. Load all 3,421 BIS entities');
  console.log('2. Enrich with alternate names and variations');
  console.log('3. Load 165 manually researched relationships');
  console.log('4. Discover US subsidiaries via SEC EDGAR (free)');
  console.log('5. Build multi-level ownership graph');
  console.log('6. Cache everything for fast access\n');

  console.log('Note: OpenCorporates discovery disabled by default (rate limits)');
  console.log('To enable: Set includeOpenCorporates: true in options\n');

  try {
    const { getOwnershipPipeline } = require('./src/services/automated-ownership-pipeline.ts');
    const pipeline = getOwnershipPipeline();

    const result = await pipeline.runFullDiscovery({
      includeOpenCorporates: false, // Disabled to avoid rate limits
      includeSECEdgar: true, // Free, no limits
      maxEntitiesOpenCorporates: 50,
      maxEntitiesSEC: 100
    });

    console.log('\n✅ PIPELINE COMPLETE!\n');

    console.log('📊 Results:');
    console.log(`   Total relationships: ${result.totalRelationships}`);
    console.log(`   Coverage: ${result.coverageStats.coveragePercent.toFixed(2)}% of BIS entities`);
    console.log(`   Enriched entities: ${result.enrichedEntities.length}`);

    console.log('\n🎯 Next Steps:');
    console.log('   1. Review cached relationships in data/ownership-cache/');
    console.log('   2. Run end-to-end tests');
    console.log('   3. Deploy to production');

  } catch (error) {
    console.error('\n❌ PIPELINE FAILED:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run pipeline
runOwnershipDiscovery();
