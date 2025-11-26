const fetch = require('node-fetch');

async function testSalesPersonsAPI() {
  try {
    console.log('🧪 Testing Sales Persons API...');
    
    // First login to get token
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unithead@hotel.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.message);
    console.log('🔑 Token received:', loginData.token ? 'Yes' : 'No');

    // Test sales persons endpoint
    const salesPersonsResponse = await fetch('http://localhost:3000/api/unit-head/sales-persons', {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });

    if (!salesPersonsResponse.ok) {
      throw new Error(`Sales persons API failed: ${salesPersonsResponse.status}`);
    }

    const salesPersonsData = await salesPersonsResponse.json();
    console.log('✅ Sales Persons API Response:');
    console.log('📊 Success:', salesPersonsData.success);
    console.log('📊 Count:', salesPersonsData.data?.salesPersons?.length || 0);
    console.log('📊 Sales Persons:');
    
    salesPersonsData.data?.salesPersons?.forEach((sp, index) => {
      console.log(`  ${index + 1}. ${sp.fullName} (${sp.username}) - ${sp.email}`);
      console.log(`     ID: ${sp._id}`);
      console.log(`     Role: ${sp.role}`);
      console.log(`     Active: ${sp.active}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSalesPersonsAPI();