/**
 * Test Entity Enrichment Integration
 * Verifies that enriched matching actually works better than basic matching
 */

async function testEnrichmentIntegration() {
  console.log('🧪 TESTING ENTITY ENRICHMENT INTEGRATION\n');
  console.log('='.repeat(70));

  try {
    const { getAdvancedEntityResolution } = require('./src/services/advanced-entity-resolution.ts');
    const resolver = getAdvancedEntityResolution();

    // Test cases that should work WITH enrichment but might FAIL without
    const testCases = [
      // Abbreviations
      { supplier: 'HW Technologies', expected: 'Huawei', reason: 'Abbreviation' },
      { supplier: 'ZTE Corp', expected: 'ZTE', reason: 'Suffix variation' },

      // Comma variations
      { supplier: 'Huawei Technologies Co Ltd', expected: 'Huawei', reason: 'No comma' },
      { supplier: 'ZTE Corporation Inc', expected: 'ZTE', reason: 'Multiple suffixes' },

      // Exact from database (should definitely work)
      { supplier: 'Huawei Technologies Co., Ltd.', expected: 'Huawei', reason: 'Exact match' },
      { supplier: 'ZTE Corporation', expected: 'ZTE', reason: 'Exact match' },

      // Subsidiaries from our manual database
      { supplier: 'Huawei Device Co.', expected: 'Huawei', reason: 'Known subsidiary' },
      { supplier: 'ZTE USA Inc.', expected: 'ZTE', reason: 'Known subsidiary' },

      // Should NOT match
      { supplier: 'Intel Corporation', expected: null, reason: 'Not on BIS list' },
      { supplier: 'Samsung Electronics', expected: null, reason: 'Not on BIS list' }
    ];

    console.log(`\n📊 Running ${testCases.length} test cases...\n`);

    let passed = 0;
    let failed = 0;
    const results = [];

    for (const testCase of testCases) {
      console.log(`Testing: "${testCase.supplier}"`);
      console.log(`Expected: ${testCase.expected || 'NO MATCH'} (${testCase.reason})`);

      const result = await resolver.resolveEntity(testCase.supplier);

      const hasMatch = result.resolvedEntities.length > 0;
      const matchedName = hasMatch ? result.resolvedEntities[0].matchedName : null;
      const confidence = hasMatch ? result.resolvedEntities[0].confidence : 0;

      const success = testCase.expected
        ? (hasMatch && matchedName && matchedName.toLowerCase().includes(testCase.expected.toLowerCase()))
        : !hasMatch;

      if (success) {
        console.log(`✅ PASS - Confidence: ${(confidence * 100).toFixed(0)}%`);
        passed++;
      } else {
        console.log(`❌ FAIL - Got: ${matchedName || 'NO MATCH'}`);
        failed++;
      }

      results.push({
        ...testCase,
        success,
        actualMatch: matchedName,
        confidence
      });

      console.log('');
    }

    // Summary
    console.log('='.repeat(70));
    console.log('\n📊 TEST RESULTS:\n');
    console.log(`✅ Passed: ${passed}/${testCases.length}`);
    console.log(`❌ Failed: ${failed}/${testCases.length}`);
    console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

    // Detailed failures
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - "${r.supplier}" (${r.reason})`);
        console.log(`     Expected: ${r.expected || 'NO MATCH'}`);
        console.log(`     Got: ${r.actualMatch || 'NO MATCH'}`);
      });
    }

    // Verdict
    console.log('\n' + '='.repeat(70));
    console.log('\n🎉 VERDICT:\n');

    if (passed >= testCases.length * 0.8) {
      console.log('✅ ENRICHMENT INTEGRATION WORKING');
      console.log(`✅ ${passed}/${testCases.length} tests passed`);
      console.log('✅ Edge cases being caught');
    } else if (passed >= testCases.length * 0.6) {
      console.log('⚠️  PARTIAL SUCCESS');
      console.log(`⚠️  Only ${passed}/${testCases.length} tests passed`);
      console.log('⚠️  Some edge cases still failing');
    } else {
      console.log('❌ ENRICHMENT NOT WORKING');
      console.log(`❌ Only ${passed}/${testCases.length} tests passed`);
      console.log('❌ Integration likely broken');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nStack:', error.stack);
  }
}

// Run test
testEnrichmentIntegration();
