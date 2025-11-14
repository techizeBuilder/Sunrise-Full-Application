// Test script for customer filtering by salesperson
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testCustomerFiltering(username, password) {
  console.log(`\n🔐 Testing customer filtering for: ${username}`);
  console.log('='.repeat(60));
  
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

    // Test sales customers endpoint
    const response = await fetch(`${BASE_URL}/api/sales/my-customers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`\n📊 Sales Customers (/api/sales/my-customers):`);
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Total customers: ${data.customers?.length || 0}`);
      
      if (data.customers && data.customers.length > 0) {
        console.log('   - Customer details:');
        data.customers.forEach((customer, index) => {
          console.log(`     ${index + 1}. ${customer.name}`);
          console.log(`        Code: ${customer.customerCode}`);
          console.log(`        Sales Contact: ${customer.salesContact}`);
          console.log(`        Email: ${customer.email || 'N/A'}`);
          console.log(`        Mobile: ${customer.mobile || 'N/A'}`);
        });
      } else {
        console.log('   - No customers found for this salesperson');
      }

      if (data.pagination) {
        console.log(`   - Pagination: Page ${data.pagination.page} of ${data.pagination.pages} (Total: ${data.pagination.total})`);
      }

      // Also test the main customers endpoint to compare
      console.log(`\n🔍 Comparing with main customers endpoint (/api/customers):`);
      
      const allCustomersResponse = await fetch(`${BASE_URL}/api/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (allCustomersResponse.ok) {
        const allCustomersData = await allCustomersResponse.json();
        console.log(`   - Main endpoint total: ${allCustomersData.customers?.length || 0} customers`);
        console.log(`   - Sales endpoint total: ${data.customers?.length || 0} customers`);
        
        if ((allCustomersData.customers?.length || 0) > (data.customers?.length || 0)) {
          console.log(`   ✅ Filtering working: Sales endpoint shows fewer customers than main endpoint`);
        } else {
          console.log(`   ⚠️  Both endpoints show same count - check if filtering is applied`);
        }
      }

    } else {
      console.log(`❌ Failed to get customers: Status ${response.status} - ${data.message}`);
    }

  } catch (error) {
    console.error(`❌ Error testing ${username}:`, error.message);
  }
}

async function runCustomerTests() {
  console.log('🧪 Testing Customer Filtering by Salesperson');
  console.log('*'.repeat(70));
  
  // Test both users
  await testCustomerFiltering('sales01', '12345678');
  await testCustomerFiltering('chetan', '12345678');
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 Expected Results:');
  console.log('- sales01 should see: 5 customers (Kolkata Retail, Global Export, etc.)');
  console.log('- chetan should see: 5 customers (Chennai Manufacturing, Mumbai Traders, etc.)');
  console.log('- Each user should see different customers');
  console.log('- Sales endpoint should show fewer customers than main endpoint');
}

// Run the tests
runCustomerTests();