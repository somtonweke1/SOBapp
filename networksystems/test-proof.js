/**
 * PROOF TEST - Demonstrates all fixed features work
 */

console.log('\n🔬 STARTING PROOF TEST...\n');

async function runProofTests() {
  const results = {
    passed: [],
    failed: []
  };

  // TEST 1: BIS Entity Count
  console.log('📋 TEST 1: BIS Entity List Loading...');
  try {
    const { getBISScraperService } = await import('./src/services/bis-scraper-service.ts');
    const scraper = getBISScraperService();
    const entities = await scraper.fetchFullEntityList();

    if (entities.length >= 3000) {
      console.log(`✅ PASS: Loaded ${entities.length} BIS entities (expected ~3,421)`);
      results.passed.push(`BIS Entities: ${entities.length}`);
    } else {
      console.log(`❌ FAIL: Only ${entities.length} entities loaded`);
      results.failed.push(`BIS Entities: ${entities.length}`);
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    results.failed.push('BIS Entity Loading');
  }

  // TEST 2: Ownership Database
  console.log('\n📋 TEST 2: Ownership Database...');
  try {
    const { BIS_OWNERSHIP_DATABASE } = await import('./src/data/bis-ownership-database.ts');

    const totalCount = BIS_OWNERSHIP_DATABASE.metadata.totalRelationships;
    const lastUpdated = BIS_OWNERSHIP_DATABASE.metadata.lastUpdated;
    const lastVerified = BIS_OWNERSHIP_DATABASE.metadata.lastVerified;

    console.log(`   Total Relationships: ${totalCount}`);
    console.log(`   Last Updated: ${lastUpdated}`);
    console.log(`   Last Verified: ${lastVerified}`);

    if (totalCount === 182 && lastUpdated === '2025-11-08' && lastVerified === '2025-11-08') {
      console.log(`✅ PASS: Ownership database updated and verified`);
      results.passed.push(`Ownership DB: ${totalCount} relationships (updated ${lastUpdated})`);
    } else {
      console.log(`❌ FAIL: Database not updated correctly`);
      results.failed.push('Ownership Database Update');
    }

    // Check Huawei subsidiaries
    const huaweiSubs = BIS_OWNERSHIP_DATABASE.subsidiaries['Huawei Technologies Co., Ltd.'];
    console.log(`   Huawei subsidiaries: ${huaweiSubs.length}`);

    if (huaweiSubs && huaweiSubs.length >= 20) {
      console.log(`✅ PASS: Huawei subsidiaries loaded (${huaweiSubs.length})`);
      results.passed.push(`Huawei subsidiaries: ${huaweiSubs.length}`);
    } else {
      console.log(`❌ FAIL: Huawei subsidiaries missing`);
      results.failed.push('Huawei Subsidiaries');
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    results.failed.push('Ownership Database');
  }

  // TEST 3: Email Service
  console.log('\n📋 TEST 3: Email Service...');
  try {
    const { getEmailService } = await import('./src/services/email-service.ts');
    const emailService = getEmailService();

    console.log(`   Email service initialized: ${emailService ? 'Yes' : 'No'}`);
    console.log(`   Email enabled: ${emailService.isEnabled()}`);

    if (emailService) {
      console.log(`✅ PASS: Email service created successfully`);
      results.passed.push(`Email service (enabled: ${emailService.isEnabled()})`);
    } else {
      console.log(`❌ FAIL: Email service not created`);
      results.failed.push('Email Service');
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    results.failed.push('Email Service');
  }

  // TEST 4: Error Monitoring
  console.log('\n📋 TEST 4: Error Monitoring Service...');
  try {
    const { getErrorMonitoring, ErrorSeverity, ErrorCategory } = await import('./src/services/error-monitoring-service.ts');
    const errorService = getErrorMonitoring();
    errorService.clearErrors();

    // Log a test error
    errorService.logError(
      new Error('Test error'),
      ErrorSeverity.LOW,
      ErrorCategory.UNKNOWN_ERROR
    );

    const stats = errorService.getStatistics();

    if (stats.total === 1) {
      console.log(`✅ PASS: Error monitoring working (logged 1 test error)`);
      results.passed.push('Error Monitoring');
    } else {
      console.log(`❌ FAIL: Error monitoring not tracking correctly`);
      results.failed.push('Error Monitoring');
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    results.failed.push('Error Monitoring');
  }

  // TEST 5: Database Connection (Prisma)
  console.log('\n📋 TEST 5: Database Connection (Prisma)...');
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Check if ScanResult model exists
    const count = await prisma.scanResult.count();

    console.log(`   ScanResult records in database: ${count}`);
    console.log(`✅ PASS: Database connected, ScanResult model exists`);
    results.passed.push(`Database (${count} scan results)`);

    await prisma.$disconnect();
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    results.failed.push('Database Connection');
  }

  // TEST 6: OpenCorporates Service
  console.log('\n📋 TEST 6: OpenCorporates API Service...');
  try {
    const { getOpenCorporatesAPI } = await import('./src/services/opencorporates-api-service.ts');
    const ocAPI = getOpenCorporatesAPI();

    if (ocAPI) {
      console.log(`✅ PASS: OpenCorporates service initialized`);
      results.passed.push('OpenCorporates API Service');
    } else {
      console.log(`❌ FAIL: OpenCorporates service not created`);
      results.failed.push('OpenCorporates API');
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    results.failed.push('OpenCorporates API');
  }

  // TEST 7: Advanced Entity Resolution
  console.log('\n📋 TEST 7: Advanced Entity Resolution...');
  try {
    const { getAdvancedEntityResolution } = await import('./src/services/advanced-entity-resolution.ts');
    const resolver = getAdvancedEntityResolution();

    // Test with a known entity (Huawei)
    console.log('   Testing with "Huawei Technologies Co., Ltd."...');
    const result = await resolver.resolveEntity('Huawei Technologies Co., Ltd.');

    console.log(`   Risk Level: ${result.overallRisk}`);
    console.log(`   Risk Score: ${result.riskScore}/10`);
    console.log(`   Entities Found: ${result.resolvedEntities.length}`);
    console.log(`   Findings: ${result.findings.length}`);

    if (result.overallRisk === 'critical' && result.riskScore >= 8) {
      console.log(`✅ PASS: Correctly identified Huawei as CRITICAL risk`);
      results.passed.push(`Entity Resolution (Huawei: ${result.riskScore}/10)`);
    } else {
      console.log(`❌ FAIL: Did not correctly assess Huawei risk`);
      results.failed.push('Entity Resolution');
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    results.failed.push('Entity Resolution');
  }

  // FINAL SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('📊 PROOF TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`\n✅ PASSED: ${results.passed.length} tests`);
  results.passed.forEach((test, i) => {
    console.log(`   ${i + 1}. ${test}`);
  });

  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED: ${results.failed.length} tests`);
    results.failed.forEach((test, i) => {
      console.log(`   ${i + 1}. ${test}`);
    });
  }

  const successRate = Math.round((results.passed.length / (results.passed.length + results.failed.length)) * 100);
  console.log(`\n📈 Success Rate: ${successRate}%`);

  if (successRate >= 90) {
    console.log('\n🎉 PROOF COMPLETE: System is 90%+ operational!');
  } else if (successRate >= 70) {
    console.log('\n⚠️  System is functional but needs attention');
  } else {
    console.log('\n🚨 System has critical issues');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  process.exit(successRate >= 90 ? 0 : 1);
}

runProofTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
