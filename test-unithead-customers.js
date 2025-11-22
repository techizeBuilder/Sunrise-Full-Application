// Test Unit Head Customer API
const API_URL = 'http://localhost:5000/api';

// Test without token first to see if endpoint exists
console.log('🧪 Testing Unit Head Customer API endpoints...');

// Test 1: Check if unit-head/customers endpoint exists
async function testUnitHeadCustomersEndpoint() {
  console.log('\n📝 Testing /api/unit-head/customers endpoint (without auth)...');
  try {
    const response = await fetch(`${API_URL}/unit-head/customers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Endpoint exists but requires authentication (expected)');
    } else if (response.status === 404) {
      console.log('❌ Endpoint does not exist!');
    } else {
      console.log('📄 Endpoint responded with status:', response.status);
    }
  } catch (error) {
    console.error('💥 Error testing endpoint:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('🚨 Server is not running! Please start the server first.');
    }
  }
}

// Test 2: Check server status
async function testServerStatus() {
  console.log('\n📝 Testing server status...');
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('⚠️ Server responded with status:', response.status);
    }
  } catch (error) {
    console.log('� Server is not responding:', error.message);
  }
}

// Run tests
async function runTests() {
  await testServerStatus();
  await testUnitHeadCustomersEndpoint();
  console.log('\n🔍 Basic endpoint test complete.');
  console.log('� Next step: Login to the app and get a fresh token to test authenticated requests.');
}

runTests();