// Test script to verify customer API endpoints are working
const fetch = require('node-fetch');

const baseUrl = 'http://localhost:5000';

async function testCustomerAPIs() {
  console.log('🧪 Testing Customer API Endpoints...\n');

  // You'll need to replace this with a valid token from your application
  const token = 'YOUR_JWT_TOKEN_HERE';
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // Test 1: Global customer API
    console.log('1️⃣ Testing Global Customer API: /api/customers');
    const globalResponse = await fetch(`${baseUrl}/api/customers`, { headers });
    console.log(`   Status: ${globalResponse.status}`);
    
    if (globalResponse.ok) {
      const globalData = await globalResponse.json();
      console.log(`   ✅ Success: Found ${globalData.customers?.length || 0} customers`);
      console.log(`   Sample customer: ${globalData.customers?.[0]?.name || 'No customers'}`);
    } else {
      console.log(`   ❌ Failed: ${globalResponse.statusText}`);
    }

    console.log();

    // Test 2: Sales customer API
    console.log('2️⃣ Testing Sales Customer API: /api/sales/customers');
    const salesResponse = await fetch(`${baseUrl}/api/sales/customers`, { headers });
    console.log(`   Status: ${salesResponse.status}`);
    
    if (salesResponse.ok) {
      const salesData = await salesResponse.json();
      console.log(`   ✅ Success: Found ${salesData.customers?.length || 0} customers`);
      console.log(`   Sample customer: ${salesData.customers?.[0]?.name || 'No customers'}`);
    } else {
      console.log(`   ❌ Failed: ${salesResponse.statusText}`);
    }

    console.log();

    // Test 3: Sales my-customers API (legacy)
    console.log('3️⃣ Testing Sales My-Customers API: /api/sales/my-customers');
    const myCustomersResponse = await fetch(`${baseUrl}/api/sales/my-customers`, { headers });
    console.log(`   Status: ${myCustomersResponse.status}`);
    
    if (myCustomersResponse.ok) {
      const myCustomersData = await myCustomersResponse.json();
      console.log(`   ✅ Success: Found ${myCustomersData.customers?.length || 0} customers`);
      console.log(`   Sample customer: ${myCustomersData.customers?.[0]?.name || 'No customers'}`);
    } else {
      console.log(`   ❌ Failed: ${myCustomersResponse.statusText}`);
    }

    console.log('\n📋 Summary:');
    console.log('• Global API (/api/customers): Shows ALL customers based on user role');
    console.log('• Sales API (/api/sales/customers): Shows ONLY assigned customers for sales personnel');
    console.log('• My-Customers API (/api/sales/my-customers): Legacy endpoint with same filtering');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions for manual testing
console.log('📖 Manual Testing Instructions:');
console.log('1. Start your server: npm start or node index.js');
console.log('2. Login to get a JWT token from browser dev tools');
console.log('3. Replace YOUR_JWT_TOKEN_HERE with actual token');
console.log('4. Run: node test-customer-apis.js');
console.log('5. Check that APIs return appropriate data based on user role\n');

// Uncomment to run the test
// testCustomerAPIs();