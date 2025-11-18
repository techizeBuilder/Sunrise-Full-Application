// Test script for sales API endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test function to login and get token
async function loginAndTest() {
  try {
    console.log('🔐 Testing login for pintu001...');
    
    // Login
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'pintu001',
        password: '12345678'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.success) {
      console.error('❌ Login failed');
      return;
    }
    
    const token = loginData.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test sales summary
    console.log('\n📊 Testing sales summary...');
    const summaryResponse = await fetch(`${BASE_URL}/sales/summary`, { headers });
    const summaryData = await summaryResponse.json();
    console.log('Summary response:', JSON.stringify(summaryData, null, 2));
    
    // Test recent orders
    console.log('\n📋 Testing recent orders...');
    const recentResponse = await fetch(`${BASE_URL}/sales/recent-orders?limit=5`, { headers });
    const recentData = await recentResponse.json();
    console.log('Recent orders response:', JSON.stringify(recentData, null, 2));
    
    // Test all orders
    console.log('\n📦 Testing all orders...');
    const ordersResponse = await fetch(`${BASE_URL}/sales/orders?page=1&limit=10`, { headers });
    const ordersData = await ordersResponse.json();
    console.log('Orders response structure:', {
      success: ordersData.success,
      dataKeys: Object.keys(ordersData.data || {}),
      orderCount: ordersData.data?.orders?.length || 0,
      paginationKeys: Object.keys(ordersData.data?.pagination || {})
    });
    
    if (ordersData.data?.orders?.length > 0) {
      console.log('First order sample:', JSON.stringify(ordersData.data.orders[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
loginAndTest();