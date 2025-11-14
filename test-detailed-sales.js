// Detailed test script for sales endpoints with authentication
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testUser(username, password) {
  console.log(`\n🔐 Testing user: ${username}`);
  console.log('='.repeat(50));
  
  try {
    // Login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success || !loginData.token) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log(`✅ Logged in as: ${loginData.user.username} (${loginData.user.role})`);
    console.log(`   User ID: ${loginData.user.id}`);

    // Test orders endpoint
    const response = await fetch(`${BASE_URL}/api/sales/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`\n📊 Orders for ${username}:`);
      console.log(`   - Total orders: ${data.orders?.length || 0}`);
      
      if (data.orders && data.orders.length > 0) {
        console.log('   - Order codes:');
        data.orders.forEach((order, index) => {
          console.log(`     ${index + 1}. ${order.orderCode} (salesPerson: ${order.salesPerson || 'NONE'})`);
        });
      }
    } else {
      console.log(`❌ Failed to get orders: ${data.message}`);
    }

  } catch (error) {
    console.error(`❌ Error testing ${username}:`, error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Sales Data Filtering');
  console.log('*'.repeat(60));
  
  // Test both users
  await testUser('sales01', '12345678');
  await testUser('chetan', '12345678');
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Expected Results:');
  console.log('- sales01 should see: ORD-2025-003, ORD-2025-012, ORD-0015, ORD-0016, ORD-0022, ORD-0028');
  console.log('- chetan should see: ORD-2025-008, ORD-2025-013, ORD-0023, ORD-0024, ORD-0027, ORD-0029');
}

// Run the tests
runTests();