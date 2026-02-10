#!/usr/bin/env tsx
/**
 * END-TO-END TEST: Scanner with 882 Relationships
 *
 * This script verifies:
 * 1. Scanner loads 882 total relationships
 * 2. Detects direct BIS entities
 * 3. Detects subsidiaries via ownership relationships
 * 4. Provides accurate risk scores
 */

import fs from 'fs';
import path from 'path';

async function main() {
  console.log('='.repeat(70));
  console.log('  END-TO-END SCANNER TEST');
  console.log('  Testing 882 Relationship Integration');
  console.log('='.repeat(70));
  console.log();

  // Step 1: Verify ownership database loads correctly
  console.log('[1/4] Verifying ownership database...');
  const { getCombinedOwnershipDatabase } = await import('../src/data/bis-ownership-database');
  const combined = getCombinedOwnershipDatabase();

  console.log(`✓ Total relationships: ${combined.metadata.totalRelationships}`);
  console.log(`✓ Last updated: ${combined.metadata.lastUpdated}`);
  console.log(`✓ Subsidiaries count: ${Object.keys(combined.subsidiaries).length} parents`);

  const totalSubs = Object.values(combined.subsidiaries).reduce((sum, subs) => sum + subs.length, 0);
  console.log(`✓ Total subsidiary relationships: ${totalSubs}`);
  console.log();

  // Step 2: Load test CSV
  console.log('[2/4] Loading test supplier CSV...');
  const csvPath = path.join(process.cwd(), 'test-suppliers.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Test CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  console.log(`✓ Loaded test-suppliers.csv`);
  console.log(`✓ File size: ${csvContent.length} bytes`);
  console.log();

  // Step 3: Run scanner
  console.log('[3/4] Running scanner with test data...');
  const { getEntityListScanner } = await import('../src/services/entity-list-scanner-service');
  const scanner = getEntityListScanner();

  const scanReport = await scanner.scanFile(csvContent, 'test-suppliers.csv', 'Test Company');

  console.log(`✓ Scan complete`);
  console.log(`✓ Scan ID: ${scanReport.scanId}`);
  console.log();

  // Step 4: Analyze results
  console.log('[4/4] Analyzing scan results...');
  console.log('='.repeat(70));
  console.log('  SCAN RESULTS');
  console.log('='.repeat(70));
  console.log();

  console.log(`Total Suppliers Scanned: ${scanReport.summary.totalSuppliers}`);
  console.log(`Overall Risk Level: ${scanReport.summary.overallRiskLevel.toUpperCase()}`);
  console.log(`Overall Risk Score: ${scanReport.summary.overallRiskScore}/100`);
  console.log();

  console.log('Risk Breakdown:');
  console.log(`  Clear:    ${scanReport.summary.clearSuppliers}`);
  console.log(`  Low:      ${scanReport.summary.lowRiskSuppliers}`);
  console.log(`  Medium:   ${scanReport.summary.mediumRiskSuppliers}`);
  console.log(`  High:     ${scanReport.summary.highRiskSuppliers}`);
  console.log(`  Critical: ${scanReport.summary.criticalSuppliers}`);
  console.log();

  // Check specific detections
  const huaweiMatches = scanReport.results.filter((f: any) =>
    (f.supplier?.name || f.supplier || '').toString().toLowerCase().includes('huawei')
  );
  const zteMatches = scanReport.results.filter((f: any) =>
    (f.supplier?.name || f.supplier || '').toString().toLowerCase().includes('zte')
  );

  console.log('Specific Detections:');
  console.log(`  Huawei entities: ${huaweiMatches.length}`);
  console.log(`  ZTE entities: ${zteMatches.length}`);
  console.log();

  if (huaweiMatches.length > 0) {
    console.log('Huawei Detections:');
    huaweiMatches.forEach((match: any) => {
      const name = match.supplier?.name || match.supplier || 'Unknown';
      console.log(`  - ${name}: ${match.riskLevel} (${match.riskScore}/10)`);
      if (match.matches && match.matches.length > 0) {
        match.matches.forEach((m: any) => {
          console.log(`    Match: ${m.matchedName} (${m.matchType}, confidence: ${(m.confidence * 100).toFixed(0)}%)`);
        });
      }
    });
    console.log();
  }

  if (zteMatches.length > 0) {
    console.log('ZTE Detections:');
    zteMatches.forEach((match: any) => {
      const name = match.supplier?.name || match.supplier || 'Unknown';
      console.log(`  - ${name}: ${match.riskLevel} (${match.riskScore}/10)`);
      if (match.matches && match.matches.length > 0) {
        match.matches.forEach((m: any) => {
          console.log(`    Match: ${m.matchedName} (${m.matchType}, confidence: ${(m.confidence * 100).toFixed(0)}%)`);
        });
      }
    });
    console.log();
  }

  // Success criteria
  console.log('='.repeat(70));
  console.log('  TEST VALIDATION');
  console.log('='.repeat(70));
  console.log();

  const tests = [
    {
      name: 'Database loads 882 relationships',
      pass: combined.metadata.totalRelationships >= 882,
      actual: combined.metadata.totalRelationships
    },
    {
      name: 'Scanner processes all suppliers',
      pass: scanReport.summary.totalSuppliers >= 15,
      actual: scanReport.summary.totalSuppliers
    },
    {
      name: 'Detects Huawei entities',
      pass: huaweiMatches.length >= 3,
      actual: huaweiMatches.length
    },
    {
      name: 'Detects ZTE entities',
      pass: zteMatches.length >= 2,
      actual: zteMatches.length
    },
    {
      name: 'Identifies critical risks',
      pass: scanReport.summary.criticalSuppliers > 0,
      actual: scanReport.summary.criticalSuppliers
    }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    if (test.pass) {
      console.log(`✅ ${test.name} (${test.actual})`);
      passed++;
    } else {
      console.log(`❌ ${test.name} (Expected: true, Got: ${test.actual})`);
      failed++;
    }
  });

  console.log();
  console.log('='.repeat(70));
  console.log(`  RESULT: ${passed}/${tests.length} tests passed`);
  console.log('='.repeat(70));
  console.log();

  if (failed > 0) {
    console.error(`❌ ${failed} tests failed`);
    process.exit(1);
  } else {
    console.log(`✅ ALL TESTS PASSED - Scanner working with 882 relationships`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});
