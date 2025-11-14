// Test script for all sales endpoints with authentication
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAllSalesEndpoints(username, password) {
  console.log(`\n🔐 Testing all sales endpoints for: ${username}`);
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

    // Test all sales endpoints
    const salesEndpoints = [
      { url: '/api/sales/orders', name: 'Orders' },
      { url: '/api/sales/my-customers', name: 'Customers' },
      { url: '/api/sales/my-deliveries', name: 'Deliveries' },
      { url: '/api/sales/my-invoices', name: 'Invoices' },
      { url: '/api/sales/refund-return', name: 'Refund/Returns' }
    ];

    for (const endpoint of salesEndpoints) {
      console.log(`\n📊 Testing ${endpoint.name} (${endpoint.url}):`);
      
      try {
        const response = await fetch(`${BASE_URL}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log(`   ✅ Status: ${response.status} - Success`);
          
          // Check different data types
          if (data.orders && data.orders.length > 0) {
            console.log(`   📦 Orders: ${data.orders.length} items`);
            data.orders.slice(0, 3).forEach((item, index) => {
              console.log(`     ${index + 1}. ${item.orderCode} (salesPerson: ${item.salesPerson})`);
            });
            if (data.orders.length > 3) console.log(`     ... and ${data.orders.length - 3} more`);
          } else if (data.customers && data.customers.length > 0) {
            console.log(`   👥 Customers: ${data.customers.length} items`);
            data.customers.slice(0, 3).forEach((item, index) => {
              console.log(`     ${index + 1}. ${item.name} (contact: ${item.salesContact || 'NONE'})`);
            });
            if (data.customers.length > 3) console.log(`     ... and ${data.customers.length - 3} more`);
          } else if (data.deliveries && data.deliveries.length > 0) {
            console.log(`   🚚 Deliveries: ${data.deliveries.length} items`);
            data.deliveries.slice(0, 3).forEach((item, index) => {
              console.log(`     ${index + 1}. ${item.orderCode} (status: ${item.status})`);
            });
            if (data.deliveries.length > 3) console.log(`     ... and ${data.deliveries.length - 3} more`);
          } else if (data.invoices && data.invoices.length > 0) {
            console.log(`   🧾 Invoices: ${data.invoices.length} items`);
            data.invoices.slice(0, 3).forEach((item, index) => {
              console.log(`     ${index + 1}. ${item.invoiceNumber || item._id} (amount: ${item.totalAmount || 'N/A'})`);
            });
            if (data.invoices.length > 3) console.log(`     ... and ${data.invoices.length - 3} more`);
          } else if (data.refundReturns && data.refundReturns.length > 0) {
            console.log(`   🔄 Refund/Returns: ${data.refundReturns.length} items`);
            data.refundReturns.slice(0, 3).forEach((item, index) => {
              console.log(`     ${index + 1}. ${item.returnCode || item._id} (status: ${item.status})`);
            });
            if (data.refundReturns.length > 3) console.log(`     ... and ${data.refundReturns.length - 3} more`);
          } else {
            console.log(`   📊 No items found`);
          }
          
          // Show pagination info
          if (data.pagination) {
            console.log(`   📄 Pagination: Page ${data.pagination.page || data.pagination.currentPage} of ${data.pagination.pages || data.pagination.totalPages} (Total: ${data.pagination.total || data.pagination.totalOrders})`);
          }
          
        } else {
          console.log(`   ❌ Status: ${response.status} - ${data.message || 'Failed'}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error(`❌ Error testing ${username}:`, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Testing All Sales Endpoints with Role-Based Filtering');
  console.log('*'.repeat(70));
  
  // Test both users
  await testAllSalesEndpoints('sales01', '12345678');
  await testAllSalesEndpoints('chetan', '12345678');
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 Expected Results:');
  console.log('- Each user should only see their own data');
  console.log('- sales01 and chetan should have different data counts');
  console.log('- All salesPerson fields should match the logged-in user ID');
}

// Run the tests
runAllTests();
