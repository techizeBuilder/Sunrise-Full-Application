// COMPREHENSIVE CUSTOMER FILTERING TEST
// Test both general and Unit Head specific endpoints

console.log('🔐 COMPREHENSIVE CUSTOMER FILTERING TEST');
console.log('=======================================\n');

async function testAllCustomerEndpoints() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  console.log('👤 Current User:', {
    username: user.username,
    role: user.role,
    companyId: user.companyId,
    companyName: user.companyName
  });
  
  if (!token) {
    console.log('❌ No token found - please login first');
    return;
  }

  const endpoints = [
    {
      name: 'General Customers API',
      url: '/api/customers?page=1&limit=10',
      description: 'General customer endpoint used by multiple components'
    },
    {
      name: 'Unit Head Customers API', 
      url: '/api/unit-head/customers?page=1&limit=10&sortBy=createdAt&sortOrder=desc',
      description: 'Unit Head specific customer endpoint'
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}`);
    console.log(`Description: ${endpoint.description}`);
    
    try {
      const response = await fetch(endpoint.url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`Status: ${response.status}`);
      
      const data = await response.json();
      
      if (data.success) {
        const customers = data.data?.customers || data.customers || [];
        const summary = data.data?.summary || {};
        
        console.log(`✅ SUCCESS - ${customers.length} customers returned`);
        console.log(`📊 Summary: Total: ${summary.totalCustomers || 'N/A'}, Active: ${summary.activeCustomers || 'N/A'}`);
        
        if (customers.length > 0) {
          // Check if all customers belong to user's company
          const userCompanyId = user.companyId;
          let validFiltering = true;
          const companyCounts = {};
          
          customers.forEach(customer => {
            const customerCompany = customer.companyId;
            companyCounts[customerCompany] = (companyCounts[customerCompany] || 0) + 1;
            
            if (user.role !== 'Super Admin' && customerCompany !== userCompanyId) {
              validFiltering = false;
              console.log(`❌ SECURITY ISSUE: Customer "${customer.name}" belongs to different company: ${customerCompany}`);
            }
          });
          
          console.log('🏢 Company distribution:', companyCounts);
          
          if (validFiltering) {
            console.log('✅ Security check passed - all customers belong to user\'s company');
          } else {
            console.log('❌ SECURITY VIOLATION: Found customers from other companies!');
          }
          
          // Show sample customers
          console.log('📋 Sample customers:');
          customers.slice(0, 3).forEach((customer, i) => {
            console.log(`   ${i+1}. ${customer.name} (${customer.city || 'No city'}) - Company: ${customer.companyId}`);
          });
        }
      } else {
        console.log(`❌ Error: ${data.message}`);
        if (data.message?.includes('company') || data.message?.includes('location')) {
          console.log('ℹ️  This error indicates proper security - user lacks company assignment');
        }
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n📋 EXPECTED BEHAVIOR:');
  console.log('✅ Super Admin: Can see all customers from all companies');
  console.log('✅ Unit Head: Can see only customers from their company');
  console.log('✅ Other roles: Can see only customers from their company');
  console.log('✅ No company assignment: Should get clear error message');
  console.log('✅ Both endpoints should have identical filtering behavior');
}

// Run the test
testAllCustomerEndpoints();

// Also provide curl commands for terminal testing
console.log('\n🖥️  TERMINAL TESTING COMMANDS:');
console.log('Replace YOUR_TOKEN with actual JWT token from localStorage.getItem("token")');
console.log('');
console.log('# Test general customers endpoint:');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:5000/api/customers?page=1&limit=10"');
console.log('');
console.log('# Test unit head customers endpoint:');
console.log('curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:5000/api/unit-head/customers?page=1&limit=10&sortBy=createdAt&sortOrder=desc"');