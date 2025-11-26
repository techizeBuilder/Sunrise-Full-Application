import fetch from 'node-fetch';
import fs from 'fs';

const testWithLogin = async () => {
  try {
    console.log('🔐 Attempting login...');
    
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'unit_manager',
        password: '12345678'
      })
    });

    console.log('📝 Login status:', loginResponse.status);
    
    const loginResult = await loginResponse.json();
    console.log('📝 Login result:', JSON.stringify(loginResult, null, 2));

    if (!loginResult.success || !loginResult.token) {
      console.error('❌ Login failed');
      return;
    }

    // Save token
    fs.writeFileSync('token.txt', loginResult.token);
    
    // Test product summary API
    console.log('\n📊 Testing Product Summary API...');
    const response = await fetch('http://localhost:5000/api/sales/product-summary?date=2025-11-26', {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📈 Status:', response.status);
    
    const result = await response.json();
    console.log('📊 Response:', JSON.stringify(result, null, 2));

    // Also test unit-manager orders API
    console.log('\n📦 Testing Unit Manager Orders API...');
    const ordersResponse = await fetch('http://localhost:5000/api/unit-manager/orders', {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📦 Orders Status:', ordersResponse.status);
    
    const ordersResult = await ordersResponse.json();
    console.log('📦 Orders Response:', JSON.stringify(ordersResult, null, 2));

  } catch (error) {
    console.error('🚨 Test error:', error);
  }
};

testWithLogin();