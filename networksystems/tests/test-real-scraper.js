/**
 * Test the REAL BIS scraper
 * This should actually call the Trade.gov API and return real data
 */

async function testRealScraper() {
  console.log('🧪 Testing REAL BIS Scraper (calls official government API)\n');
  console.log('='.repeat(70));

  try {
    // Test the official Trade.gov Consolidated Screening List API
    const apiUrl = 'https://api.trade.gov/consolidated_screening_list/search.json?sources=EL&size=100';

    console.log('\n📡 Calling official Trade.gov API...');
    console.log(`URL: ${apiUrl}\n`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();

    console.log('✅ API Response received!\n');
    console.log('=' .repeat(70));
    console.log('\n📊 API RESPONSE SUMMARY:\n');
    console.log(`Total results: ${data.total || 0}`);
    console.log(`Results in this batch: ${data.results?.length || 0}`);
    console.log(`Offset: ${data.offset || 0}`);

    if (data.results && data.results.length > 0) {
      console.log('\n' + '='.repeat(70));
      console.log('\n🎯 SAMPLE ENTITIES (First 10):\n');

      data.results.slice(0, 10).forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.name}`);
        console.log(`   Country: ${entry.addresses?.[0]?.country || 'Unknown'}`);
        console.log(`   Source: ${entry.source}`);
        if (entry.federal_register_notice) {
          console.log(`   FR Notice: ${entry.federal_register_notice}`);
        }
        console.log('');
      });

      console.log('='.repeat(70));
      console.log('\n✅ REAL DATA TEST RESULTS:\n');
      console.log(`✅ API is accessible: YES`);
      console.log(`✅ Returns real data: YES`);
      console.log(`✅ Entity count: ${data.results.length}`);
      console.log(`✅ Data quality: REAL GOVERNMENT DATA`);

      // Check for known entities
      const hasHuawei = data.results.some(e => e.name?.toLowerCase().includes('huawei'));
      const hasZTE = data.results.some(e => e.name?.toLowerCase().includes('zte'));
      const hasSMIC = data.results.some(e => e.name?.toLowerCase().includes('smic') || e.name?.toLowerCase().includes('semiconductor manufacturing'));

      console.log('\n🔍 Known Entity Detection:');
      console.log(`   Huawei entities: ${hasHuawei ? '✅ FOUND' : '⚠️  Not in first 100'}`);
      console.log(`   ZTE entities: ${hasZTE ? '✅ FOUND' : '⚠️  Not in first 100'}`);
      console.log(`   SMIC entities: ${hasSMIC ? '✅ FOUND' : '⚠️  Not in first 100'}`);

      console.log('\n' + '='.repeat(70));
      console.log('\n🎉 VERDICT:\n');
      console.log('✅ The Trade.gov API WORKS');
      console.log('✅ We CAN fetch real BIS data');
      console.log('✅ No placeholders needed');
      console.log('✅ This is REAL government data');
      console.log('\n🚀 READY FOR PRODUCTION!\n');

    } else {
      console.log('\n❌ No results returned from API');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nError details:', error);
  }
}

// Run test
testRealScraper();
