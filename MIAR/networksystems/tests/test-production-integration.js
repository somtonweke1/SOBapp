/**
 * Test PRODUCTION INTEGRATION
 * Verifies that the full chain loads 3,421 entities (not 14)
 */

const path = require('path');

// Must set NODE_ENV to use TypeScript files
process.env.NODE_ENV = 'development';

async function testProductionIntegration() {
  console.log('🧪 TESTING PRODUCTION INTEGRATION\n');
  console.log('='.repeat(70));

  try {
    // Test 1: Check BIS Scraper Service
    console.log('\n📊 Test 1: BIS Scraper Service');
    console.log('-'.repeat(70));

    const { getBISScraper } = require('./src/services/bis-scraper-service.ts');
    const bisScraper = getBISScraper();

    // Force fresh fetch (not from cache)
    console.log('Fetching fresh entity list...');
    const entities = await bisScraper.fetchFullEntityList();

    console.log(`\n✅ Fetched ${entities.length} entities`);

    if (entities.length < 100) {
      console.error(`\n❌ FAIL: Only ${entities.length} entities (expected 3,000+)`);
      console.log('\n📋 Sample entities:');
      entities.slice(0, 10).forEach((e, i) => {
        console.log(`${i + 1}. ${e.name} (${e.country})`);
      });
    } else {
      console.log(`\n✅ SUCCESS: ${entities.length} entities loaded`);

      // Test 2: Verify key entities exist
      console.log('\n📊 Test 2: Verify Key Entities');
      console.log('-'.repeat(70));

      const hasHuawei = entities.some(e => e.name.toLowerCase().includes('huawei'));
      const hasZTE = entities.some(e => e.name.toLowerCase().includes('zte'));
      const hasSMIC = entities.some(e => e.name.toLowerCase().includes('smic') || e.name.toLowerCase().includes('semiconductor manufacturing'));

      console.log(`Huawei: ${hasHuawei ? '✅ FOUND' : '❌ NOT FOUND'}`);
      console.log(`ZTE: ${hasZTE ? '✅ FOUND' : '❌ NOT FOUND'}`);
      console.log(`SMIC: ${hasSMIC ? '✅ FOUND' : '❌ NOT FOUND'}`);

      // Test 3: Test Advanced Entity Resolution
      console.log('\n📊 Test 3: Advanced Entity Resolution');
      console.log('-'.repeat(70));

      const { getAdvancedEntityResolution } = require('./src/services/advanced-entity-resolution.ts');
      const advancedResolution = getAdvancedEntityResolution();

      const testResult = await advancedResolution.resolveEntity('Huawei Device Co.');

      console.log(`Test supplier: Huawei Device Co.`);
      console.log(`Risk level: ${testResult.overallRisk}`);
      console.log(`Risk score: ${testResult.riskScore}/10`);
      console.log(`Confidence: ${(testResult.overallConfidence * 100).toFixed(0)}%`);
      console.log(`Findings: ${testResult.findings.length}`);
      console.log(`Matched entities: ${testResult.resolvedEntities.length}`);

      if (testResult.resolvedEntities.length > 0) {
        console.log('\n📋 Matched entities:');
        testResult.resolvedEntities.forEach(e => {
          console.log(`  - ${e.matchedName} (${e.matchType}, ${(e.confidence * 100).toFixed(0)}% confidence)`);
        });
      }
    }

    // Final verdict
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 FINAL VERDICT:\n');

    if (entities.length >= 3000) {
      console.log('✅ PRODUCTION READY - 3,000+ entities loaded');
      console.log('✅ Automated scraper WORKING');
      console.log('✅ Integration VERIFIED');
      console.log('\n🚀 You can ship this to Baukunst with confidence!');
    } else if (entities.length >= 100) {
      console.log('⚠️  PARTIAL SUCCESS - Got', entities.length, 'entities');
      console.log('⚠️  Expected 3,000+, but at least automated scraping is working');
    } else {
      console.log('❌ FAIL - Only', entities.length, 'entities');
      console.log('❌ Automated scraper NOT integrated properly');
      console.log('❌ Still using hardcoded/fallback data');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run test
testProductionIntegration();
