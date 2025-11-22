// Test the customer API directly in browser console
// This should be run in the browser console after logging in as Unit Head

(async function testCustomerAPI() {
  console.log('🧪 Testing Unit Head Customer API from browser...');
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  console.log('Token exists:', !!token);
  
  if (!token) {
    console.log('❌ No token found. Please login first.');
    return;
  }
  
  // Test the direct API call
  try {
    const response = await fetch('/api/unit-head/customers', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.success) {
      console.log('✅ API working!');
      console.log('📊 Customers found:', data.data?.customers?.length || 0);
      
      if (data.data?.customers?.length > 0) {
        console.log('👤 Sample customers:');
        data.data.customers.slice(0, 3).forEach((customer, index) => {
          console.log(`${index + 1}. ${customer.name} (${customer.email}) - Company: ${customer.companyId?.name || 'N/A'}`);
        });
      } else {
        console.log('📋 No customers found for this Unit Head');
      }
    } else {
      console.log('❌ API failed:', data.message);
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
})();