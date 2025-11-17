// Simple test for authenticated sales items API

const testAuthenticatedSalesItems = async () => {
  console.log('🧪 TESTING AUTHENTICATED SALES ITEMS API');
  console.log('='.repeat(50));

  try {
    // Step 1: Login to get a token
    console.log('\n1. Attempting login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'radhe',  // Using known user
        password: '12345678'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }
    
    console.log('✅ Login successful');
    console.log('👤 User:', loginData.user.username, `(${loginData.user.role})`);
    console.log('🔍 Exact role value:', JSON.stringify(loginData.user.role));
    console.log('🔍 Role length:', loginData.user.role.length);
    console.log('🏢 Company:', loginData.user.company?.name || 'No company');
    
    const token = loginData.token;
    
    // Step 2: Test sales items API with token
    console.log('\n2. Testing sales items API with authentication...');
    const itemsResponse = await fetch('http://localhost:5000/api/sales/items?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const itemsData = await itemsResponse.json();
    
    if (!itemsData.success) {
      console.log('❌ Sales items API failed:', itemsData.message);
      return;
    }
    
    console.log('✅ Sales items API successful');
    console.log('📦 Items returned:', itemsData.items?.length || 0);
    console.log('📄 Pagination:', itemsData.pagination);
    
    // Show sample items
    if (itemsData.items && itemsData.items.length > 0) {
      console.log('\n📋 Sample items:');
      itemsData.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} (${item.code || 'No code'})`);
        console.log(`      Location: ${item.storeLocation || 'No location'}`);
        console.log(`      Stock: ${item.qty || 0}`);
      });
    }
    
    // Step 3: Test without token to confirm authentication requirement
    console.log('\n3. Testing without token (should fail)...');
    try {
      const noAuthResponse = await fetch('http://localhost:5000/api/sales/items');
      const noAuthData = await noAuthResponse.json();
      console.log('⚠️  Response without token:', noAuthData.message);
    } catch (error) {
      console.log('❌ Expected authentication error:', error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

console.log(`
🎯 AUTHENTICATION FIX SUMMARY:

✅ ISSUES RESOLVED:
1. Fixed ProductSelector to use authenticated API from @/lib/queryClient
2. Updated apiRequest calls to use correct method signature: apiRequest('GET', url)
3. Both components now include Bearer token automatically

✅ EXPECTED BEHAVIOR:
- Sales users: Authenticated calls to /api/sales/items (company-filtered)
- Other users: Authenticated calls to /api/items (full access)  
- Unauthenticated calls: Rejected with "Access denied. No token provided"

🔧 AUTHENTICATION FLOW:
1. Frontend gets token from localStorage 
2. apiRequest automatically includes Authorization header
3. Backend validates token and extracts user info
4. Company filtering applied based on user's companyId
`);

// Run the test
testAuthenticatedSalesItems();