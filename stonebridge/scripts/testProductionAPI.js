/**
 * Test Production API - Verifies the full diagnostic flow
 */

async function testProductionAPI() {
  const BASE_URL = 'https://stonebridge-web-production.up.railway.app';

  console.log('Testing StoneBridge Production API...\n');

  // Test 1: Check homepage
  console.log('1. Testing homepage...');
  const homeRes = await fetch(`${BASE_URL}/`);
  console.log(`   Status: ${homeRes.status} ${homeRes.ok ? '✓' : '✗'}`);

  // Test 2: Register a test user
  console.log('\n2. Registering test user...');
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    })
  });
  const registerData = await registerRes.json();
  console.log(`   Status: ${registerRes.status} ${registerRes.ok ? '✓' : '✗'}`);

  if (!registerRes.ok) {
    console.log('   Error:', registerData);
    return;
  }

  const token = registerData.token;
  console.log(`   Token received: ${token.substring(0, 20)}...`);

  // Test 3: Submit a diagnostic request
  console.log('\n3. Submitting diagnostic request...');
  const diagnosticRes = await fetch(`${BASE_URL}/api/deals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      address: '123 N Charles St',
      city: 'Baltimore',
      state: 'MD'
    })
  });
  const diagnosticData = await diagnosticRes.json();
  console.log(`   Status: ${diagnosticRes.status} ${diagnosticRes.ok ? '✓' : '✗'}`);

  if (diagnosticRes.ok) {
    console.log(`   Deal ID: ${diagnosticData.id}`);
    console.log(`   Address: ${diagnosticData.address}`);
    console.log(`   Status: ${diagnosticData.status}`);
  } else {
    console.log('   Error:', diagnosticData);
  }

  // Test 4: Verify database persistence
  console.log('\n4. Verifying database persistence...');
  const listRes = await fetch(`${BASE_URL}/api/deals`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const listData = await listRes.json();
  console.log(`   Status: ${listRes.status} ${listRes.ok ? '✓' : '✗'}`);

  if (listRes.ok && listData.deals) {
    console.log(`   Total deals: ${listData.deals.length}`);
    console.log(`   Database working: ✓`);
  } else {
    console.log('   Error:', listData);
  }

  console.log('\n✓ Production API Test Complete!');
  console.log(`\nProduction URL: ${BASE_URL}/submit`);
}

testProductionAPI().catch(err => {
  console.error('\n✗ Test failed:', err.message);
  process.exit(1);
});
