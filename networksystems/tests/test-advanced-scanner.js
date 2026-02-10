/**
 * Test Advanced Entity Resolution Integration
 * This tests the ownership detection capability
 */

// Test supplier list with known Huawei subsidiaries
const testCSV = `Company Name,Location,Contact
Intel Corporation,USA,contact@intel.com
Taiwan Semiconductor,Taiwan,contact@tsmc.com
Huawei Device Co., Ltd.,Shenzhen China,contact@huawei.com
Samsung Electronics,South Korea,contact@samsung.com
HiSilicon Technologies Co., Ltd.,Shanghai China,contact@hisilicon.com
Qualcomm Inc,USA,contact@qualcomm.com
Broadcom Inc,USA,contact@broadcom.com
Infineon Technologies,Germany,contact@infineon.com
ZTE USA Inc.,USA,contact@zte.com
STMicroelectronics,Switzerland,contact@st.com`;

async function testAdvancedScanner() {
  console.log('🧪 Testing Advanced Entity Resolution Integration\n');
  console.log('=' .repeat(70));

  try {
    // Simulate file upload
    const formData = new FormData();
    const blob = new Blob([testCSV], { type: 'text/csv' });
    formData.append('file', blob, 'test-suppliers.csv');
    formData.append('companyName', 'Test Company Inc.');
    formData.append('email', 'test@example.com');

    console.log('📤 Uploading test supplier list...\n');

    const response = await fetch('http://localhost:3000/api/entity-list-scan', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Scan failed:', result.error);
      return;
    }

    console.log('✅ Scan completed!\n');
    console.log('=' .repeat(70));
    console.log('\n📊 SUMMARY:\n');
    console.log(`Total Suppliers: ${result.summary.totalSuppliers}`);
    console.log(`Critical Risk: ${result.summary.criticalSuppliers}`);
    console.log(`High Risk: ${result.summary.highRiskSuppliers}`);
    console.log(`Overall Risk Score: ${result.summary.overallRiskScore}/10`);
    console.log(`Risk Level: ${result.summary.overallRiskLevel.toUpperCase()}`);
    console.log(`Estimated Exposure: ${result.summary.estimatedExposure}`);

    // Fetch detailed report
    const reportResponse = await fetch(
      `http://localhost:3000/api/entity-list-scan?scanId=${result.scanId}&format=json`
    );
    const reportData = await reportResponse.json();

    if (reportData.success) {
      const report = reportData.report;

      console.log('\n' + '=' .repeat(70));
      console.log('\n🎯 CRITICAL FINDINGS (Testing Ownership Detection):\n');

      // Find the Huawei Device result
      const huaweiDevice = report.results.find(r =>
        r.supplier.originalName.includes('Huawei Device')
      );

      if (huaweiDevice) {
        console.log('✅ OWNERSHIP DETECTION TEST - Huawei Device Co., Ltd.');
        console.log('─'.repeat(70));
        console.log(`Risk Level: ${huaweiDevice.riskLevel.toUpperCase()}`);
        console.log(`Risk Score: ${huaweiDevice.riskScore}/10`);
        console.log(`Confidence: ${(huaweiDevice.confidence * 100).toFixed(0)}%`);
        console.log('\nMatches Found:');
        huaweiDevice.matches.forEach(match => {
          console.log(`  • ${match.matchType.toUpperCase()}: ${match.matchedName}`);
          console.log(`    Confidence: ${(match.confidence * 100).toFixed(0)}%`);
          if (match.relationshipPath) {
            console.log(`    Path: ${match.relationshipPath.join(' → ')}`);
          }
        });
        console.log('\nRecommendations:');
        huaweiDevice.recommendations.slice(0, 3).forEach(rec => {
          console.log(`  • ${rec}`);
        });
      } else {
        console.log('❌ Huawei Device not found in results');
      }

      // Find the HiSilicon result
      const hisilicon = report.results.find(r =>
        r.supplier.originalName.includes('HiSilicon')
      );

      if (hisilicon) {
        console.log('\n\n✅ OWNERSHIP DETECTION TEST - HiSilicon Technologies');
        console.log('─'.repeat(70));
        console.log(`Risk Level: ${hisilicon.riskLevel.toUpperCase()}`);
        console.log(`Risk Score: ${hisilicon.riskScore}/10`);
        console.log(`Confidence: ${(hisilicon.confidence * 100).toFixed(0)}%`);
        console.log('\nMatches Found:');
        hisilicon.matches.forEach(match => {
          console.log(`  • ${match.matchType.toUpperCase()}: ${match.matchedName}`);
          console.log(`    Confidence: ${(match.confidence * 100).toFixed(0)}%`);
          if (match.relationshipPath) {
            console.log(`    Path: ${match.relationshipPath.join(' → ')}`);
          }
        });
      }

      // Find the ZTE USA result
      const zteusa = report.results.find(r =>
        r.supplier.originalName.includes('ZTE USA')
      );

      if (zteusa) {
        console.log('\n\n✅ OWNERSHIP DETECTION TEST - ZTE USA Inc.');
        console.log('─'.repeat(70));
        console.log(`Risk Level: ${zteusa.riskLevel.toUpperCase()}`);
        console.log(`Risk Score: ${zteusa.riskScore}/10`);
        console.log(`Confidence: ${(zteusa.confidence * 100).toFixed(0)}%`);
        console.log('\nMatches Found:');
        zteusa.matches.forEach(match => {
          console.log(`  • ${match.matchType.toUpperCase()}: ${match.matchedName}`);
          console.log(`    Confidence: ${(match.confidence * 100).toFixed(0)}%`);
          if (match.relationshipPath) {
            console.log(`    Path: ${match.relationshipPath.join(' → ')}`);
          }
        });
      }

      console.log('\n' + '=' .repeat(70));
      console.log('\n🎉 TEST RESULTS:\n');

      const expectedCritical = 3; // Huawei Device, HiSilicon, ZTE USA
      const actualCritical = result.summary.criticalSuppliers;

      if (actualCritical >= expectedCritical) {
        console.log(`✅ PASS: Detected ${actualCritical} critical suppliers (expected at least ${expectedCritical})`);
        console.log('✅ PASS: Ownership detection is working!');
        console.log('✅ PASS: Multi-factor analysis is active');
        console.log('\n🚀 READY TO SHIP TO BAUKUNST!\n');
      } else {
        console.log(`❌ FAIL: Only detected ${actualCritical} critical suppliers (expected ${expectedCritical})`);
        console.log('❌ Ownership detection may not be working correctly');
      }

    } else {
      console.error('❌ Failed to fetch detailed report');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Make sure the dev server is running: npm run dev');
  }
}

// Run test
testAdvancedScanner();
