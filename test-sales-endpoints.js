// Test script for sales endpoints with authentication
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test credentials - you'll need to replace with valid credentials
const testCredentials = {
  username: 'chetan',
  password: '12345678'
};

async function loginAndTestSalesEndpoints() {
  try {
    // 1. Login to get auth token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success || !loginData.token) {
      console.error('❌ Login failed');
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful');

    // 2. Test sales endpoints
    const salesEndpoints = [
      '/api/sales/orders',
      '/api/sales/my-customers', 
      '/api/sales/my-deliveries',
      '/api/sales/my-invoices',
      '/api/sales/refund-return'
    ];

    for (const endpoint of salesEndpoints) {
      console.log(`\n🧪 Testing ${endpoint}...`);
      
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log(`✅ ${endpoint}: Success`);
          console.log(`   - Status: ${response.status}`);
          console.log(`   - Data keys: ${Object.keys(data).join(', ')}`);
          if (data.orders) console.log(`   - Orders count: ${data.orders?.length || 0}`);
          if (data.customers) console.log(`   - Customers count: ${data.customers?.length || 0}`);
          if (data.deliveries) console.log(`   - Deliveries count: ${data.deliveries?.length || 0}`);
          if (data.invoices) console.log(`   - Invoices count: ${data.invoices?.length || 0}`);
          if (data.returns) console.log(`   - Returns count: ${data.returns?.length || 0}`);
        } else {
          console.log(`❌ ${endpoint}: Failed`);
          console.log(`   - Status: ${response.status}`);
          console.log(`   - Error: ${data.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
loginAndTestSalesEndpoints();