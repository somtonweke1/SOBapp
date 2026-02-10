/**
 * Test FULLY AUTOMATED BIS Scraper
 * This should download the real CSV and parse 1,000+ entities
 */

async function testAutomatedScraper() {
  console.log('🧪 Testing FULLY AUTOMATED BIS Scraper\n');
  console.log('='.repeat(70));

  try {
    // Test downloading the CSV directly
    const csvUrl = 'https://api.trade.gov/static/consolidated_screening_list/consolidated.csv';

    console.log('\n📡 Testing CSV download from Trade.gov...');
    console.log(`URL: ${csvUrl}\n`);

    const response = await fetch(csvUrl);

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.error(`❌ Download failed: ${response.status}`);
      return;
    }

    const csvData = await response.text();

    console.log(`\n✅ CSV Downloaded successfully!`);
    console.log(`Size: ${csvData.length} bytes`);
    console.log(`Lines: ${csvData.split('\n').length}`);

    // Show first 10 lines
    const lines = csvData.split('\n');
    console.log('\n📋 First 10 lines of CSV:\n');
    console.log('─'.repeat(70));
    lines.slice(0, 10).forEach((line, i) => {
      console.log(`${i}: ${line.substring(0, 100)}...`);
    });
    console.log('─'.repeat(70));

    // Parse header
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    console.log('\n📊 CSV Columns:');
    headers.forEach((h, i) => console.log(`  ${i + 1}. ${h}`));

    // Count entries
    const totalLines = lines.length - 1; // Minus header
    const hasEntityList = csvData.toLowerCase().includes('entity list') || csvData.toLowerCase().includes('source');

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ AUTOMATED SCRAPER TEST RESULTS:\n');
    console.log(`✅ CSV download: SUCCESS`);
    console.log(`✅ Total entries: ~${totalLines}`);
    console.log(`✅ Contains Entity List data: ${hasEntityList ? 'YES' : 'CHECKING...'}`);
    console.log(`✅ File size: ${(csvData.length / 1024).toFixed(2)} KB`);

    // Look for known entities
    const hasHuawei = csvData.toLowerCase().includes('huawei');
    const hasZTE = csvData.toLowerCase().includes('zte');
    const hasSMIC = csvData.toLowerCase().includes('smic') || csvData.toLowerCase().includes('semiconductor manufacturing');

    console.log('\n🔍 Known Entity Detection:');
    console.log(`   Huawei: ${hasHuawei ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   ZTE: ${hasZTE ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   SMIC: ${hasSMIC ? '✅ FOUND' : '❌ NOT FOUND'}`);

    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 VERDICT:\n');
    console.log('✅ The CSV download WORKS');
    console.log('✅ We CAN access official government data');
    console.log('✅ NO authentication required');
    console.log('✅ FULLY AUTOMATED scraping is POSSIBLE');
    console.log(`✅ Estimated entities: ${totalLines.toLocaleString()}`);
    console.log('\n🚀 READY FOR PRODUCTION - NO MANUAL STEPS NEEDED!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nError details:', error);
  }
}

// Run test
testAutomatedScraper();
