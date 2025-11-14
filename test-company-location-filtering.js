// Test Company Location Login and Sales Approval Filtering

const testCompanyLocationImplementation = async () => {
  console.log('🧪 TESTING COMPANY LOCATION & SALES APPROVAL FILTERING');
  console.log('='.repeat(60));

  try {
    // Test 1: Login with Unit Head (should get company location)
    console.log('\n1. Testing login with company location info...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'radhe',
        password: '12345678'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Login successful');
      console.log('User company info:', {
        id: loginData.user.id,
        username: loginData.user.username,
        role: loginData.user.role,
        companyId: loginData.user.companyId,
        company: loginData.user.company
      });
      
      if (loginData.user.company) {
        console.log('🏢 Company Location:', loginData.user.company.location);
        console.log('🏢 Company Details:', {
          name: loginData.user.company.name,
          unitName: loginData.user.company.unitName,
          city: loginData.user.company.city,
          state: loginData.user.company.state
        });
      } else {
        console.log('❌ No company information in response');
      }
      
      const token = loginData.token;
      
      // Test 2: Check Sales Approval data filtering
      console.log('\n2. Testing Sales Approval data filtering...');
      
      const salesApprovalResponse = await fetch('http://localhost:3000/api/unit-manager/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const salesData = await salesApprovalResponse.json();
      
      if (salesData.success) {
        console.log('✅ Sales Approval data retrieved');
        console.log('Products found:', salesData.data?.length || 0);
        console.log('Metadata:', salesData.metadata);
        
        // Log some sample data
        if (salesData.data && salesData.data.length > 0) {
          console.log('\n📊 Sample Product Data:');
          salesData.data.slice(0, 2).forEach(product => {
            console.log(`  Product: ${product.productName}`);
            console.log(`    Total Orders: ${product.totalOrders}`);
            console.log(`    Total Quantity: ${product.totalQuantity}`);
            console.log(`    Sales Persons: ${product.salesPersons?.length || 0}`);
            
            if (product.salesPersons && product.salesPersons.length > 0) {
              product.salesPersons.forEach(sp => {
                console.log(`      ${sp.fullName}: ${sp.orderCount} orders, ${sp.totalQuantity} qty`);
              });
            }
          });
        }
      } else {
        console.log('❌ Failed to get sales approval data:', salesData.message);
      }
      
      // Test 3: Check individual orders API
      console.log('\n3. Testing individual orders filtering...');
      
      const ordersResponse = await fetch('http://localhost:3000/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const ordersData = await ordersResponse.json();
      
      if (ordersData.success) {
        console.log('✅ Individual orders data retrieved');
        console.log('Orders found:', ordersData.orders?.length || 0);
        
        if (ordersData.orders && ordersData.orders.length > 0) {
          console.log('\n📋 Sample Orders:');
          ordersData.orders.slice(0, 3).forEach(order => {
            console.log(`  Order: ${order.orderCode}`);
            console.log(`    Status: ${order.status}`);
            console.log(`    Sales Person: ${order.salesPerson?.fullName || 'Unknown'}`);
            console.log(`    Customer: ${order.customer?.name || 'Unknown'}`);
          });
        }
      } else {
        console.log('❌ Failed to get orders data:', ordersData.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginData.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

console.log(`
🎯 IMPLEMENTATION SUMMARY:

✅ LOGIN API ENHANCEMENT:
- Added company population in login response
- Includes company.location, company.city, company.state
- Returns full company object with all location details

✅ SALES APPROVAL FILTERING:
- Modified /api/unit-manager/orders to filter by company
- Only shows orders from sales persons in same company
- Filters sales persons based on companyId

✅ INDIVIDUAL ORDERS FILTERING:  
- Modified /api/orders to filter by company for Unit Managers
- Role-based filtering with company consideration
- Unit Managers see only orders from their company

🧪 EXPECTED BEHAVIOR:
1. Login response includes company location info
2. Sales Approval page shows only data from user's company
3. Order counts and statistics are company-specific
4. Sales persons shown are from same company only

🔧 TESTING:
- Login as Unit Head (radhe/12345678)
- Should see company: "Sunrize Bakery - Delhi"
- Sales Approval should show filtered data
- Only orders from same company should appear

Run testCompanyLocationImplementation() to test the APIs.
`);

// Export for browser testing
if (typeof window !== 'undefined') {
  window.testCompanyLocationImplementation = testCompanyLocationImplementation;
}

// Run test if in Node environment and server is available
if (typeof module !== 'undefined' && module.exports) {
  testCompanyLocationImplementation();
}