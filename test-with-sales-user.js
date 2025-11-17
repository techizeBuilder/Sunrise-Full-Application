// Test with actual Sales user

const testWithSalesUser = async () => {
  console.log('🧪 TESTING WITH SALES USER');
  console.log('='.repeat(40));

  // Try different potential sales users
  const salesCredentials = [
    { username: 'sales01', password: '12345678' },
    { username: 'sales', password: '12345678' },
    { username: 'sales1', password: '12345678' },
    { username: 'priyansh', password: '12345678' } // Check if priyansh is sales user
  ];

  for (const creds of salesCredentials) {
    console.log(`\nTrying login: ${creds.username}`);
    
    try {
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      
      const loginData = await loginResponse.json();
      
      if (loginData.success) {
        console.log(`✅ Login successful: ${loginData.user.username}`);
        console.log(`👤 Role: ${loginData.user.role}`);
        console.log(`🏢 Company: ${loginData.user.company?.name || 'No company'}`);
        
        // Test sales items API if this is a sales user
        if (loginData.user.role === 'Sales' || loginData.user.role === 'Unit Manager') {
          console.log(`\n🔍 Testing /api/sales/items with ${loginData.user.role}...`);
          
          const itemsResponse = await fetch('http://localhost:5000/api/sales/items?limit=3', {
            headers: {
              'Authorization': `Bearer ${loginData.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const itemsData = await itemsResponse.json();
          
          if (itemsData.success) {
            console.log('✅ Sales items API works!');
            console.log(`📦 Found ${itemsData.items?.length || 0} items`);
            if (itemsData.items && itemsData.items.length > 0) {
              console.log('📋 Sample item:', itemsData.items[0].name);
            }
            break; // Success, no need to test other users
          } else {
            console.log('❌ Sales items API failed:', itemsData.message);
          }
        } else {
          console.log(`ℹ️  User role '${loginData.user.role}' not authorized for sales routes`);
        }
      } else {
        console.log(`❌ Login failed for ${creds.username}:`, loginData.message);
      }
    } catch (error) {
      console.log(`❌ Error testing ${creds.username}:`, error.message);
    }
  }
};

console.log(`
🎯 SALES ROUTES AUTHORIZATION FIX:

✅ CORRECTED AUTHORIZATION:
- Removed 'Unit Head' from sales routes
- Sales routes now only allow: Sales, Unit Manager, Super Admin
- Unit Head users should use their own /api/unit-head routes

✅ ROLE LOGIC:
- Sales: Direct sales person access
- Unit Manager: Can manage sales in their unit  
- Super Admin: Full system access
- Unit Head: Uses separate unit-head routes (NOT sales routes)

🔧 TESTING APPROACH:
- Find actual Sales user in system
- Test /api/sales/items with proper Sales role
- Verify company location filtering works
`);

testWithSalesUser();