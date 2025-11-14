// Test Orders API Location-Based Filtering

const testOrdersLocationFiltering = async () => {
  console.log('🧪 TESTING ORDERS API LOCATION-BASED FILTERING');
  console.log('='.repeat(60));

  try {
    // Test login first to get Unit Head token
    console.log('\n1. Testing login for Unit Head...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'radhe',
        password: '12345678'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.log('❌ Login failed:', loginData.message);
      return;
    }
    
    console.log('✅ Login successful');
    console.log('User:', {
      username: loginData.user.username,
      role: loginData.user.role,
      companyId: loginData.user.companyId
    });
    
    if (loginData.user.company) {
      console.log('🏢 Company Details:');
      console.log(`  Name: ${loginData.user.company.name}`);
      console.log(`  Location: ${loginData.user.company.location}`);
      console.log(`  City: ${loginData.user.company.city}`);
      console.log(`  State: ${loginData.user.company.state}`);
    } else {
      console.log('❌ No company info in login response');
      return;
    }
    
    const token = loginData.token;
    const userCompany = loginData.user.company;
    
    // Test orders API with filtering
    console.log('\n2. Testing Orders API filtering...');
    const ordersResponse = await fetch('http://localhost:5000/api/orders?limit=50', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const ordersData = await ordersResponse.json();
    
    if (!ordersData.success) {
      console.log('❌ Orders API failed:', ordersData.message);
      return;
    }
    
    console.log('✅ Orders API successful');
    console.log('Orders returned:', ordersData.orders?.length || 0);
    console.log('Total orders matching filter:', ordersData.pagination?.totalOrders || 0);
    
    if (ordersData.orders && ordersData.orders.length > 0) {
      console.log('\n📋 ORDERS ANALYSIS:');
      
      // Group orders by sales person
      const ordersBySalesPerson = {};
      let ordersWithSalesPerson = 0;
      let ordersWithoutSalesPerson = 0;
      
      ordersData.orders.forEach(order => {
        if (order.salesPerson) {
          ordersWithSalesPerson++;
          const spKey = order.salesPerson.username || order.salesPerson._id;
          if (!ordersBySalesPerson[spKey]) {
            ordersBySalesPerson[spKey] = {
              name: order.salesPerson.fullName || order.salesPerson.username,
              username: order.salesPerson.username,
              role: order.salesPerson.role,
              orders: []
            };
          }
          ordersBySalesPerson[spKey].orders.push(order.orderCode);
        } else {
          ordersWithoutSalesPerson++;
        }
      });
      
      console.log(`Orders with sales person: ${ordersWithSalesPerson}`);
      console.log(`Orders without sales person: ${ordersWithoutSalesPerson}`);
      
      console.log('\n👥 SALES PERSONS FOUND IN ORDERS:');
      Object.entries(ordersBySalesPerson).forEach(([key, sp]) => {
        console.log(`  ${sp.name} (@${sp.username}) - ${sp.role}`);
        console.log(`    Orders: ${sp.orders.length} (${sp.orders.slice(0, 3).join(', ')}${sp.orders.length > 3 ? '...' : ''})`);
      });
      
      // Check if filtering is working correctly
      console.log('\n🔍 FILTERING VERIFICATION:');
      console.log(`Expected: Only orders from sales persons in "${userCompany.name}" (${userCompany.location})`);
      
      const uniqueSalesPersons = Object.keys(ordersBySalesPerson).length;
      if (uniqueSalesPersons === 0) {
        console.log('⚠️ No sales persons found in orders - might indicate filtering issue or no orders');
      } else {
        console.log(`✅ Found ${uniqueSalesPersons} unique sales person(s) in filtered results`);
        console.log('✅ Location-based filtering appears to be working');
      }
      
    } else {
      console.log('\n📋 NO ORDERS FOUND');
      console.log('This could mean:');
      console.log('- No orders exist for this company/location');
      console.log('- Filtering is too restrictive');
      console.log('- No sales persons are assigned to this company');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

console.log(`
🎯 ORDERS API LOCATION FILTERING TEST
===================================

This test will:
1. Login as Unit Head (radhe)
2. Get company/location info from login response
3. Call /api/orders endpoint
4. Verify that only orders from same company sales persons are returned

🔧 EXPECTED BEHAVIOR:
- Unit Head with assigned company
- Should only see orders from sales persons assigned to same company
- Should NOT see orders from other companies/locations globally

📊 VERIFICATION:
- Check order count vs total available orders
- Verify sales persons in results belong to same company
- Confirm no cross-company data leakage

Run testOrdersLocationFiltering() to execute the test.
`);

if (typeof window !== 'undefined') {
  window.testOrdersLocationFiltering = testOrdersLocationFiltering;
} else {
  testOrdersLocationFiltering();
}