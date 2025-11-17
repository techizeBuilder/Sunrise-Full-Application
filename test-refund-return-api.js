// Test Sales Refund/Return API with Company Location Filtering

const testSalesRefundReturnAPI = async () => {
  console.log('🧪 TESTING SALES REFUND/RETURN API WITH LOCATION FILTERING');
  console.log('='.repeat(60));

  try {
    // Step 1: Login as sales user
    console.log('\n1. Logging in as sales user...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'priyansh',
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
    console.log('🏢 Company:', loginData.user.company?.name);
    console.log('📍 Location:', loginData.user.company?.location);
    
    const token = loginData.token;
    
    // Step 2: Test refund-return API
    console.log('\n2. Testing Sales Refund/Return API...');
    const refundResponse = await fetch('http://localhost:5000/api/sales/refund-return?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const refundData = await refundResponse.json();
    
    if (!refundData.success) {
      console.log('❌ Refund/Return API failed:', refundData.message);
      return;
    }
    
    console.log('✅ Refund/Return API successful');
    console.log('📦 Refund/Returns found:', refundData.refundReturns?.length || 0);
    console.log('📄 Pagination:', refundData.pagination);
    
    // Show sample refund/returns
    if (refundData.refundReturns && refundData.refundReturns.length > 0) {
      console.log('\n📋 Sample Refund/Returns:');
      refundData.refundReturns.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.reason || 'No reason'}`);
        console.log(`      Status: ${item.status || 'Unknown'}`);
        console.log(`      Amount: ${item.amount || 'N/A'}`);
        console.log(`      Customer: ${item.customer?.customerName || 'Unknown customer'}`);
        console.log(`      Date: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}`);
        console.log('');
      });
    } else {
      console.log('\n📋 No refund/returns found for this company location');
    }
    
    // Step 3: Compare with a different user to verify filtering
    console.log('\n3. Testing with different user for comparison...');
    
    // Try with sales01 user if exists
    const altLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'sales01',
        password: '12345678'
      })
    });
    
    const altLoginData = await altLoginResponse.json();
    
    if (altLoginData.success) {
      console.log(`👤 Testing with: ${altLoginData.user.username} (${altLoginData.user.role})`);
      console.log(`🏢 Company: ${altLoginData.user.company?.name || 'No company'}`);
      
      const altRefundResponse = await fetch('http://localhost:5000/api/sales/refund-return?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${altLoginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const altRefundData = await altRefundResponse.json();
      
      if (altRefundData.success) {
        console.log('📦 Alt user refund/returns:', altRefundData.refundReturns?.length || 0);
        
        // Compare results
        const firstUserCount = refundData.refundReturns?.length || 0;
        const secondUserCount = altRefundData.refundReturns?.length || 0;
        
        if (firstUserCount !== secondUserCount) {
          console.log('✅ Different results = Company filtering is working!');
        } else {
          console.log('⚠️  Same results - check if filtering is properly applied');
        }
      }
    }
    
    // Step 4: Check the API response structure
    console.log('\n4. API Response Structure Analysis:');
    console.log('Response keys:', Object.keys(refundData));
    
    if (refundData.refundReturns && refundData.refundReturns.length > 0) {
      console.log('Sample item keys:', Object.keys(refundData.refundReturns[0]));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

console.log(`
🎯 TESTING REFUND/RETURN API:

📋 WHAT TO CHECK:
1. API returns company-filtered results
2. Only refund/returns from same company location  
3. Proper response structure with pagination
4. Real data instead of dummy data

📊 EXPECTED BEHAVIOR:
- Sales user gets refund/returns from their company only
- Different companies get different results
- Proper API response format

🔧 API ENDPOINTS:
- Backend: GET /api/sales/refund-return
- Should filter by user's companyId
- Should include customer and order details
`);

testSalesRefundReturnAPI();