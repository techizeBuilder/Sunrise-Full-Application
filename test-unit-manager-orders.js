// Test unit_manager01 orders API specifically
import fetch from 'node-fetch';

async function testUnitManagerOrders() {
  try {
    console.log('🧪 TESTING UNIT MANAGER 01 ORDERS API');
    console.log('='.repeat(50));
    
    // Login as unit_manager01
    console.log('\n1. Testing login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'unit_manager01',
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
    }
    
    const token = loginData.token;
    
    // Test orders API
    console.log('\n2. Testing Orders API...');
    const ordersResponse = await fetch('http://localhost:5000/api/orders?limit=20', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const ordersData = await ordersResponse.json();
    
    console.log('Response Status:', ordersResponse.status);
    console.log('Response Data:', JSON.stringify(ordersData, null, 2));
    
    if (ordersData.success && ordersData.orders) {
      console.log('\n📊 ORDERS ANALYSIS:');
      console.log(`Total orders returned: ${ordersData.orders.length}`);
      
      if (ordersData.orders.length > 0) {
        console.log('\nOrder details:');
        ordersData.orders.forEach((order, index) => {
          console.log(`${index + 1}. ${order.orderCode} by ${order.salesPerson?.username || 'Unknown'} (${order.salesPerson?.role || 'Unknown Role'})`);
        });
      } else {
        console.log('❌ NO ORDERS RETURNED - This is the issue!');
      }
    } else {
      console.log('❌ API Error:', ordersData.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testUnitManagerOrders();