// Test script for main orders endpoint
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testOrdersEndpoint(username, password) {
  console.log(`\n🔐 Testing main orders endpoint for: ${username}`);
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

    // Test main orders endpoint
    const ordersUrl = `${BASE_URL}/api/orders?page=1&limit=10&sortBy=createdAt&sortOrder=desc`;
    const response = await fetch(ordersUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`\n📊 Main Orders Endpoint (/api/orders):`);
      console.log(`   - Total orders: ${data.orders?.length || 0}`);
      console.log(`   - Pagination: Page ${data.pagination?.currentPage} of ${data.pagination?.totalPages}`);
      console.log(`   - Total in DB: ${data.pagination?.totalOrders}`);
      
      if (data.orders && data.orders.length > 0) {
        console.log('   - Order codes:');
        data.orders.forEach((order, index) => {
          console.log(`     ${index + 1}. ${order.orderCode} (salesPerson: ${order.salesPerson || 'NONE'})`);
        });
      }

      // Also test sales orders endpoint for comparison
      const salesResponse = await fetch(`${BASE_URL}/api/sales/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const salesData = await salesResponse.json();
      
      if (salesResponse.ok) {
        console.log(`\n📊 Sales Orders Endpoint (/api/sales/orders):`);
        console.log(`   - Total orders: ${salesData.orders?.length || 0}`);
        
        if (salesData.orders && salesData.orders.length > 0) {
          console.log('   - Order codes:');
          salesData.orders.forEach((order, index) => {
            console.log(`     ${index + 1}. ${order.orderCode} (salesPerson: ${order.salesPerson || 'NONE'})`);
          });
        }
      }

      // Check if both endpoints return same data for sales users
      const mainCount = data.orders?.length || 0;
      const salesCount = salesData.orders?.length || 0;
      
      console.log(`\n🔍 Comparison:`);
      if (mainCount === salesCount) {
        console.log(`   ✅ Both endpoints return same count: ${mainCount}`);
      } else {
        console.log(`   ❌ Different counts - Main: ${mainCount}, Sales: ${salesCount}`);
      }

    } else {
      console.log(`❌ Failed to get orders: ${data.message}`);
    }

  } catch (error) {
    console.error(`❌ Error testing ${username}:`, error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Main Orders Endpoint Filtering');
  console.log('*'.repeat(60));
  
  // Test both users
  await testOrdersEndpoint('sales01', '12345678');
  await testOrdersEndpoint('chetan', '12345678');
}

// Run the tests
runTests();