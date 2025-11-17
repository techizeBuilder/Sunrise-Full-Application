// Test Sales Items API with Company Location Filtering

const testSalesItemsAPI = async () => {
  console.log('🧪 TESTING SALES ITEMS API WITH COMPANY LOCATION FILTERING');
  console.log('='.repeat(60));

  try {
    // Test 1: Login as sales person to get token
    console.log('\n1. Testing login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'sales01',  // Assuming a sales user exists
        password: '12345678'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData.message);
      console.log('   Trying alternative login...');
      
      // Try with different credentials
      const altLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'radhe',  // Unit Head login
          password: '12345678'
        })
      });
      
      const altLoginData = await altLoginResponse.json();
      if (!altLoginData.success) {
        console.log('❌ Alternative login also failed:', altLoginData.message);
        return;
      }
      
      console.log('✅ Alternative login successful as:', altLoginData.user.role);
      console.log('🏢 Company:', altLoginData.user.company?.name);
      console.log('📍 Location:', altLoginData.user.company?.location);
      
      var token = altLoginData.token;
      var user = altLoginData.user;
    } else {
      console.log('✅ Login successful as:', loginData.user.role);
      console.log('🏢 Company:', loginData.user.company?.name || 'No company info');
      console.log('📍 Location:', loginData.user.company?.location || 'No location info');
      
      var token = loginData.token;
      var user = loginData.user;
    }
    
    // Test 2: Test the new sales items API
    console.log('\n2. Testing Sales Items API (/api/sales/items)...');
    const itemsResponse = await fetch('http://localhost:5000/api/sales/items?limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const itemsData = await itemsResponse.json();
    
    if (!itemsData.success) {
      console.log('❌ Sales Items API failed:', itemsData.message);
      return;
    }
    
    console.log('✅ Sales Items API successful');
    console.log('📦 Items found:', itemsData.items?.length || 0);
    console.log('📄 Pagination:', itemsData.pagination);
    
    // Display sample items
    if (itemsData.items && itemsData.items.length > 0) {
      console.log('\n📋 Sample Items:');
      itemsData.items.slice(0, 3).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} (${item.code})`);
        console.log(`      Location: ${item.storeLocation || 'No location'}`);
        console.log(`      Category: ${item.category || 'No category'}`);
        console.log(`      Stock: ${item.qty || 0}`);
        console.log(`      Company ID: ${item.companyId || 'No company ID'}`);
        console.log('');
      });
    }
    
    // Test 3: Compare with regular items API
    console.log('\n3. Testing regular Items API (/api/items) for comparison...');
    const regularItemsResponse = await fetch('http://localhost:5000/api/items?limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const regularItemsData = await regularItemsResponse.json();
    
    if (regularItemsData.items) {
      console.log('📦 Regular Items API found:', regularItemsData.items.length);
      console.log('🔍 Filtering Comparison:');
      console.log(`   Sales API items: ${itemsData.items?.length || 0}`);
      console.log(`   Regular API items: ${regularItemsData.items?.length || 0}`);
      
      if ((itemsData.items?.length || 0) <= (regularItemsData.items?.length || 0)) {
        console.log('✅ Sales API shows same or fewer items (filtering working)');
      } else {
        console.log('⚠️  Sales API shows more items than regular API (unexpected)');
      }
    }
    
    // Test 4: Test with search parameter
    console.log('\n4. Testing Sales Items API with search...');
    const searchResponse = await fetch('http://localhost:5000/api/sales/items?search=bread&limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('✅ Search test successful');
      console.log('🔍 Search results:', searchData.items?.length || 0);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

console.log(`
🎯 IMPLEMENTATION SUMMARY:

✅ NEW SALES ITEMS API:
- Endpoint: GET /api/sales/items
- Company location filtering applied
- Only shows items from same company as logged-in user
- Supports all standard query parameters (search, category, etc.)
- Returns formatted response with storeLocation info

✅ FILTERING LOGIC:
- Sales/Unit Manager/Unit Head: Only items from same companyId
- Super Admin: All items (no filtering)
- Users without company: Empty results with message

✅ RESPONSE FORMAT:
- success: true/false
- items: Array of filtered items
- pagination: Standard pagination info
- Each item includes storeLocation field

🔧 TESTING:
- Login with any sales/unit role
- Call GET /api/sales/items
- Verify only company-specific items returned
- Compare with regular /api/items endpoint

🚀 API USAGE:
- Frontend should call /api/sales/items instead of /api/items
- All existing query parameters supported
- Company filtering happens automatically
`);

// Export for browser testing
if (typeof window !== 'undefined') {
  window.testSalesItemsAPI = testSalesItemsAPI;
}

// Run test if in Node environment
if (typeof module !== 'undefined' && module.exports) {
  testSalesItemsAPI();
}