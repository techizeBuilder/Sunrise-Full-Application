// Test Unit Head Order APIs
const testUnitHeadOrderAPIs = async () => {
  const baseURL = 'http://localhost:5000/api/unit-head';
  const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Unit Head token
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': token
  };

  console.log('🧪 Testing Unit Head Order APIs...\n');

  try {
    // 1. Test GET /api/unit-head/orders (View Orders)
    console.log('1. Testing VIEW orders: GET /api/unit-head/orders');
    const viewResponse = await fetch(`${baseURL}/orders`, { headers });
    const viewData = await viewResponse.json();
    console.log(`   Status: ${viewResponse.status}`);
    console.log(`   Orders found: ${viewData.data?.orders?.length || 0}`);
    
    if (viewData.data?.orders?.length > 0) {
      const firstOrder = viewData.data.orders[0];
      const orderId = firstOrder._id;
      console.log(`   First order ID: ${orderId}\n`);

      // 2. Test GET /api/unit-head/orders/:id (View Single Order)
      console.log(`2. Testing VIEW single order: GET /api/unit-head/orders/${orderId}`);
      const singleResponse = await fetch(`${baseURL}/orders/${orderId}`, { headers });
      const singleData = await singleResponse.json();
      console.log(`   Status: ${singleResponse.status}`);
      console.log(`   Order found: ${singleData.data ? 'Yes' : 'No'}\n`);

      // 3. Test PUT /api/unit-head/orders/:id (Edit Order)
      console.log(`3. Testing EDIT order: PUT /api/unit-head/orders/${orderId}`);
      const editResponse = await fetch(`${baseURL}/orders/${orderId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          notes: 'Updated by API test at ' + new Date().toISOString()
        })
      });
      const editData = await editResponse.json();
      console.log(`   Status: ${editResponse.status}`);
      console.log(`   Edit successful: ${editData.success ? 'Yes' : 'No'}\n`);

      // 4. Test PATCH /api/unit-head/orders/:id/status (Update Status)
      console.log(`4. Testing STATUS update: PATCH /api/unit-head/orders/${orderId}/status`);
      const statusResponse = await fetch(`${baseURL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'processing'
        })
      });
      const statusData = await statusResponse.json();
      console.log(`   Status: ${statusResponse.status}`);
      console.log(`   Status update successful: ${statusData.success ? 'Yes' : 'No'}\n`);

      // Note: Skip DELETE test to avoid removing actual data
      console.log('5. DELETE test skipped (to preserve data)');
      console.log(`   DELETE endpoint: DELETE /api/unit-head/orders/${orderId}\n`);
    }

    // 5. Test POST /api/unit-head/orders (Create Order) 
    console.log('6. Testing CREATE order: POST /api/unit-head/orders');
    const createResponse = await fetch(`${baseURL}/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customerId: '67368d6527af99ccdbcb0b1f', // Sample customer ID
        orderDate: new Date().toISOString(),
        products: [
          {
            product: '691c4bfe27a44855b8947ca7', // Sample product ID
            quantity: 2,
            unitPrice: 50
          }
        ],
        notes: 'API test order'
      })
    });
    const createData = await createResponse.json();
    console.log(`   Status: ${createResponse.status}`);
    console.log(`   Create successful: ${createData.success ? 'Yes' : 'No'}`);
    console.log(`   New order ID: ${createData.data?._id || 'N/A'}\n`);

    console.log('✅ API Test Results:');
    console.log(`✅ View Orders: ${viewResponse.status === 200 ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Edit Orders: ${editResponse?.status === 200 ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Delete Orders: Available at DELETE /api/unit-head/orders/:id`);
    console.log(`✅ Create Orders: ${createResponse.status === 200 || createResponse.status === 201 ? 'WORKING' : 'FAILED'}`);
    console.log(`✅ Status Update: ${statusResponse?.status === 200 ? 'WORKING' : 'FAILED'}`);

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
};

// Run test if this is the main module
if (require.main === module) {
  testUnitHeadOrderAPIs();
}

module.exports = { testUnitHeadOrderAPIs };