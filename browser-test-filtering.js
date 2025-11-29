// BROWSER CONSOLE TEST FOR UNIT HEAD CUSTOMER FILTERING
// Copy and paste this into your browser console after logging in as Unit Head

console.log('🧪 Testing Unit Head Customer Filtering Fix...\n');

async function testCustomerFiltering() {
  try {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('🔐 Authentication Check:');
    console.log('Token exists:', !!token);
    console.log('User role:', user.role);
    console.log('User companyId:', user.companyId);
    console.log('User company:', user.companyName);
    
    if (!token) {
      console.log('❌ No token found - please login first');
      return;
    }
    
    if (user.role !== 'Unit Head') {
      console.log('❌ Not logged in as Unit Head - current role:', user.role);
      return;
    }
    
    if (!user.companyId) {
      console.log('❌ Unit Head has no company assignment');
      return;
    }
    
    console.log('\n📡 Making API request to /api/unit-head/customers...');
    
    const response = await fetch('/api/unit-head/customers?page=1&limit=10&sortBy=createdAt&sortOrder=desc', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('\n📊 API Response:', data);
    
    if (data.success) {
      console.log('\n✅ SUCCESS! Filtering is working correctly');
      console.log('📈 Statistics:');
      console.log(`   Customers returned: ${data.data?.customers?.length || 0}`);
      console.log(`   Total customers: ${data.data?.summary?.totalCustomers || 0}`);
      console.log(`   Active customers: ${data.data?.summary?.activeCustomers || 0}`);
      console.log(`   Inactive customers: ${data.data?.summary?.inactiveCustomers || 0}`);
      
      if (data.data?.customers?.length > 0) {
        console.log('\n👥 Sample customers:');
        data.data.customers.slice(0, 3).forEach((customer, index) => {
          console.log(`   ${index + 1}. ${customer.name} (${customer.city || 'No city'}) - Company: ${customer.companyId || 'No company'}`);
        });
        
        // Verify all customers belong to the same company
        const userCompanyId = user.companyId;
        const allSameCompany = data.data.customers.every(customer => 
          customer.companyId === userCompanyId
        );
        
        if (allSameCompany) {
          console.log('✅ All customers belong to Unit Head\'s company');
        } else {
          console.log('❌ SECURITY ISSUE: Found customers from other companies!');
        }
      } else {
        console.log('ℹ️  No customers found for this company');
      }
    } else {
      console.log('❌ API Error:', data.message);
      
      if (data.message?.includes('company/location')) {
        console.log('🔧 This error is EXPECTED if Unit Head has no company assignment');
        console.log('🔧 The fix is working - preventing data leakage!');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

console.log('🚀 Starting customer filtering test...');
testCustomerFiltering();

console.log('\n📋 EXPECTED RESULTS:');
console.log('✅ Only customers from Unit Head\'s company should be shown');
console.log('✅ Total count should reflect only company customers');
console.log('✅ All returned customers should have same companyId');
console.log('✅ If no company assigned, should get clear error message');