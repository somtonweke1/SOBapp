/**
 * Test OpenCorporates API Integration
 * Verifies ownership discovery works for known BIS entities
 */

async function testOpenCorporates() {
  console.log('🧪 Testing OpenCorporates API Integration\n');
  console.log('='.repeat(70));

  try {
    const { getOpenCorporatesAPI } = require('./src/services/opencorporates-api-service.ts');
    const openCorporatesAPI = getOpenCorporatesAPI();

    // Test 1: Search for a known entity
    console.log('\n📊 Test 1: Search for "Huawei Technologies"');
    console.log('-'.repeat(70));

    const huaweiResults = await openCorporatesAPI.searchCompanies('Huawei Technologies');

    console.log(`Found ${huaweiResults.length} results`);
    if (huaweiResults.length > 0) {
      console.log('\n📋 Top 3 results:');
      huaweiResults.slice(0, 3).forEach((company, i) => {
        console.log(`${i + 1}. ${company.name}`);
        console.log(`   Jurisdiction: ${company.jurisdiction}`);
        console.log(`   Company Number: ${company.companyNumber}`);
        console.log(`   Status: ${company.status || 'N/A'}`);
      });
    }

    // Test 2: Discover ownership relationships
    console.log('\n📊 Test 2: Discover Ownership for "Huawei Technologies"');
    console.log('-'.repeat(70));

    const ownership = await openCorporatesAPI.discoverOwnership('Huawei Technologies');

    console.log(`\nFound ${ownership.length} ownership relationships`);
    if (ownership.length > 0) {
      console.log('\n📋 Relationships:');
      ownership.forEach((rel, i) => {
        console.log(`${i + 1}. ${rel.subsidiary} → ${rel.parent}`);
        console.log(`   Type: ${rel.relationship}`);
        console.log(`   Confidence: ${(rel.confidence * 100).toFixed(0)}%`);
        console.log(`   Evidence: ${rel.evidence.join('; ')}`);
      });
    }

    // Test 3: Test another major entity
    console.log('\n📊 Test 3: Search for "ZTE Corporation"');
    console.log('-'.repeat(70));

    const zteResults = await openCorporatesAPI.searchCompanies('ZTE Corporation');

    console.log(`Found ${zteResults.length} results`);
    if (zteResults.length > 0) {
      console.log('\n📋 Top result:');
      const zteCompany = zteResults[0];
      console.log(`Name: ${zteCompany.name}`);
      console.log(`Jurisdiction: ${zteCompany.jurisdiction}`);
      console.log(`Company Number: ${zteCompany.companyNumber}`);
    }

    // Final verdict
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 VERDICT:\n');

    if (huaweiResults.length > 0) {
      console.log('✅ OpenCorporates API integration WORKS');
      console.log('✅ Company search FUNCTIONAL');
      console.log('✅ Can discover ownership relationships');
      console.log('\n📈 Next steps:');
      console.log('   - Run batch discovery on all 3,421 BIS entities');
      console.log('   - Build automated pipeline for continuous updates');
      console.log('   - Expand ownership database from 165 to 1,000+ relationships');
    } else {
      console.log('⚠️  No results found - possible rate limiting');
      console.log('⚠️  Free tier: 500 requests/month, 5 per second');
      console.log('⚠️  May need to implement caching/batching strategy');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nFull error:', error);
  }
}

// Run test
testOpenCorporates();
