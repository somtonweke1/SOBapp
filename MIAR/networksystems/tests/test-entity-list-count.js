/**
 * Count how many BIS Entity List entries we get from automated scraper
 */

async function countEntityListEntries() {
  console.log('📊 Counting BIS Entity List Entries...\n');

  try {
    const csvUrl = 'https://api.trade.gov/static/consolidated_screening_list/consolidated.csv';
    const response = await fetch(csvUrl);
    const csvData = await response.text();

    const lines = csvData.split('\n');
    console.log(`Total CSV lines: ${lines.length.toLocaleString()}`);

    // Count lines containing "Entity List"
    let entityListCount = 0;
    const entityListEntries = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('Entity List (EL)')) {
        entityListCount++;

        // Extract entity name (usually column 6)
        const match = line.match(/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
        if (match && match[6]) {
          entityListEntries.push(match[6]);
        }
      }
    }

    console.log(`\n✅ BIS Entity List entries: ${entityListCount.toLocaleString()}`);
    console.log(`\n📋 Sample Entity List entries (first 20):\n`);

    entityListEntries.slice(0, 20).forEach((name, i) => {
      console.log(`${i + 1}. ${name}`);
    });

    console.log(`\n...and ${(entityListCount - 20).toLocaleString()} more\n`);

    console.log('='.repeat(70));
    console.log('\n🎉 FINAL COUNT:\n');
    console.log(`✅ Total entries in CSV: ${(lines.length - 1).toLocaleString()}`);
    console.log(`✅ BIS Entity List entries: ${entityListCount.toLocaleString()}`);
    console.log(`✅ Other screening lists: ${(lines.length - 1 - entityListCount).toLocaleString()}`);
    console.log('\n🚀 FULLY AUTOMATED - Downloads and filters automatically!\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

countEntityListEntries();
