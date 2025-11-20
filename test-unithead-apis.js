// Unit Head API Test - Test all CRUD operations
async function testUnitHeadAPIs() {
  const baseURL = 'http://localhost:5000';
  
  // You need to get a valid token first from login
  const token = localStorage.getItem('token');
  console.log('Using token:', token ? 'Token found' : 'No token');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  try {
    console.log('\n=== Testing Unit Head Orders APIs ===');
    
    // Test 1: Get Orders
    console.log('\n1. Testing GET /api/unit-head/orders');
    const getResponse = await fetch(`${baseURL}/api/unit-head/orders`, {
      method: 'GET',
      headers
    });
    const getResult = await getResponse.json();
    console.log('GET Status:', getResponse.status);
    console.log('GET Result:', getResult);
    
    if (getResult.data?.orders?.length > 0) {
      const firstOrder = getResult.data.orders[0];
      const orderId = firstOrder._id;
      
      // Test 2: Get Single Order
      console.log(`\n2. Testing GET /api/unit-head/orders/${orderId}`);
      const getOneResponse = await fetch(`${baseURL}/api/unit-head/orders/${orderId}`, {
        method: 'GET',
        headers
      });
      const getOneResult = await getOneResponse.json();
      console.log('GET ONE Status:', getOneResponse.status);
      console.log('GET ONE Result:', getOneResult);
      
      // Test 3: Update Order Status
      console.log(`\n3. Testing PATCH /api/unit-head/orders/${orderId}/status`);
      const statusResponse = await fetch(`${baseURL}/api/unit-head/orders/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'processing' })
      });
      const statusResult = await statusResponse.json();
      console.log('PATCH Status:', statusResponse.status);
      console.log('PATCH Result:', statusResult);
      
      // Test 4: Update Order
      console.log(`\n4. Testing PUT /api/unit-head/orders/${orderId}`);
      const updateResponse = await fetch(`${baseURL}/api/unit-head/orders/${orderId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          orderDate: firstOrder.orderDate,
          status: 'pending',
          notes: 'Updated via API test'
        })
      });
      const updateResult = await updateResponse.json();
      console.log('PUT Status:', updateResponse.status);
      console.log('PUT Result:', updateResult);
    }
    
    // Test 5: Get Customers
    console.log('\n5. Testing GET /api/customers');
    const customersResponse = await fetch(`${baseURL}/api/customers`, {
      method: 'GET',
      headers
    });
    const customersResult = await customersResponse.json();
    console.log('Customers Status:', customersResponse.status);
    console.log('Customers Result:', customersResult);
    
    // Test 6: Get Inventory Items
    console.log('\n6. Testing GET /api/unit-head/inventory/items');
    const itemsResponse = await fetch(`${baseURL}/api/unit-head/inventory/items`, {
      method: 'GET',
      headers
    });
    const itemsResult = await itemsResponse.json();
    console.log('Items Status:', itemsResponse.status);
    console.log('Items Result:', itemsResult);
    
  } catch (error) {
    console.error('API Test Error:', error);
  }
}

// Run the test
console.log('Starting Unit Head API tests...');
testUnitHeadAPIs();