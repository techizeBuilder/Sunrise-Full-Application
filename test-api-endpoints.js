import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
  console.log('🧪 Testing Production Summary API Endpoints...\n');

  try {
    // Test 1: Debug endpoint (no auth required)
    console.log('1️⃣ Testing debug endpoint...');
    const debugResponse = await fetch(`${BASE_URL}/api/sales/debug`);
    const debugData = await debugResponse.json();
    console.log('✅ Debug endpoint:', debugResponse.status, debugData.message);
    console.log('Available routes:', debugData.availableRoutes);
    
    // Test 2: Test with authentication
    console.log('\n2️⃣ Testing with authentication...');
    
    // First login to get token
    console.log('Attempting login...');
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin', // Default admin user
        password: 'admin123' // Default admin password
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.token;
      console.log('✅ Login successful, user:', loginData.user?.username);

      // Test authenticated endpoint
      console.log('\n3️⃣ Testing authenticated summary endpoint...');
      const testSummaryResponse = await fetch(`${BASE_URL}/api/sales/test-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (testSummaryResponse.ok) {
        const testData = await testSummaryResponse.json();
        console.log('✅ Test summary endpoint:', testSummaryResponse.status);
        console.log('User info:', testData.user);
      } else {
        const errorData = await testSummaryResponse.json();
        console.log('❌ Test summary failed:', testSummaryResponse.status, errorData);
      }

      // Test product summary endpoint
      console.log('\n4️⃣ Testing product summary endpoint...');
      const productSummaryResponse = await fetch(`${BASE_URL}/api/sales/product-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (productSummaryResponse.ok) {
        const summaryData = await productSummaryResponse.json();
        console.log('✅ Product summary endpoint:', productSummaryResponse.status);
        console.log('Products found:', summaryData.products?.length || 0);
      } else {
        const errorData = await productSummaryResponse.json();
        console.log('❌ Product summary failed:', productSummaryResponse.status, errorData);
      }

      // Test update endpoint
      console.log('\n5️⃣ Testing update endpoint...');
      const updateResponse = await fetch(`${BASE_URL}/api/sales/update-product-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          productId: '507f1f77bcf86cd799439011', // Dummy product ID
          updates: {
            packing: 100,
            physicalStock: 200
          }
        })
      });
      
      if (updateResponse.ok) {
        const updateData = await updateResponse.json();
        console.log('✅ Update endpoint:', updateResponse.status);
        console.log('Update result:', updateData.success ? 'Success' : 'Failed');
      } else {
        const errorData = await updateResponse.json();
        console.log('❌ Update failed:', updateResponse.status, errorData.message);
      }

    } else {
      const loginError = await loginResponse.json();
      console.log('❌ Login failed:', loginResponse.status, loginError);
      console.log('Skipping authenticated tests...');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.log('\n🔧 Make sure the server is running: npm run dev');
  }

  console.log('\n🏁 Test completed!');
}

testEndpoints();