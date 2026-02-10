/**
 * Test PFAS API Endpoint
 * Run: node test-pfas-api.js
 */

const testPFASEndpoint = async () => {
  const API_URL = 'https://miar.live/api/pfas-scan';

  const testData = {
    facilityName: "Springfield Water Treatment Facility",
    email: "test@miar.live",
    systemType: "Fixed Bed",
    vesselDiameter: 2.5,
    vesselHeight: 3.0,
    flowRate: 100,
    bedHeight: 2.0,
    bedVolume: 10,
    ebct: 15,

    toc: 3.0,
    sulfate: 50,
    chloride: 30,
    alkalinity: 100,
    hardness: 150,
    ph: 7.0,
    temperature: 20,

    pfasCompounds: {
      PFOA: 25.0,  // Exceeds EPA MCL (4.0 ng/L)
      PFOS: 15.0,  // Exceeds EPA MCL (4.0 ng/L)
      PFNA: 5.0,
      PFHxA: 8.0,
      PFHxS: 12.0,
      PFDA: 3.0,
      PFBS: 10.0,
      PFHpA: 4.0,
      PFUnDA: 2.0,
      PFDoA: 1.0
    },
    totalPFAS: 85.0,

    gacType: "Coconut Shell",
    gacDensity: 450,
    gacParticleSize: 1.5,
    gacIodineNumber: 1000,
    gacSurfaceArea: 1200,

    gacCostPerKg: 3.5,
    replacementCost: 15000,
    laborCost: 5000,
    disposalCost: 3000,

    operatingDaysPerYear: 365,
    operatingHoursPerDay: 24,
    targetRemovalEfficiency: 95,
    safetyFactor: 1.5
  };

  console.log('🧪 Testing PFAS API at:', API_URL);
  console.log('📊 Submitting test data...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
      return;
    }

    const result = await response.json();

    console.log('\n✅ SUCCESS! PFAS Module is LIVE!\n');
    console.log('📋 Scan ID:', result.scanId);
    console.log('\n📊 Summary:');
    console.log('  - Total PFAS Detected:', result.summary.totalPFASDetected);
    console.log('  - Compounds Above Limit:', result.summary.compoundsAboveLimit);
    console.log('  - Risk Level:', result.summary.overallRiskLevel.toUpperCase());
    console.log('  - Risk Score:', result.summary.overallRiskScore + '/10');
    console.log('  - Compliance Status:', result.summary.complianceStatus);
    console.log('  - Urgency Level:', result.summary.urgencyLevel.toUpperCase());
    console.log('  - Predicted System Life:', result.summary.predictedSystemLife.toFixed(1), 'months');

    if (result.summary.estimatedFines) {
      console.log('  - Estimated Fines:', result.summary.estimatedFines);
    }

    console.log('\n🎉 PFAS Module Successfully Deployed to miar.live!');
    console.log('🔗 API Endpoint: https://miar.live/api/pfas-scan');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.log('\n⏳ Deployment may still be in progress. Wait 1-2 minutes and try again.');
  }
};

// Run the test
testPFASEndpoint();
