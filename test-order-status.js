// Test script to verify order status update fix

const testOrderStatusUpdate = async () => {
  try {
    const baseUrl = 'http://localhost:5000';
    
    // Step 1: Login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'unitmanager',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Step 2: Get sales orders to find one to update
    console.log('📋 Fetching sales orders...');
    const ordersResponse = await fetch(`${baseUrl}/api/unit-manager/sales-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!ordersResponse.ok) {
      throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    const orders = ordersData.orders || [];
    
    if (orders.length === 0) {
      console.log('❌ No orders found to test with');
      return;
    }

    // Find a pending order
    const pendingOrder = orders.find(order => order.status === 'pending');
    
    if (!pendingOrder) {
      console.log('❌ No pending orders found to test with');
      return;
    }

    console.log(`✅ Found order to test: ${pendingOrder._id} (${pendingOrder.status})`);

    // Step 3: Try to update the order status
    console.log('🔄 Updating order status to approved...');
    const updateResponse = await fetch(`${baseUrl}/api/unit-manager/sales-orders/${pendingOrder._id}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'approved',
        notes: 'Test update via API'
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`Order status update failed: ${updateResponse.status} - ${errorData.message || 'Unknown error'}`);
    }

    const updateData = await updateResponse.json();
    console.log('✅ Order status updated successfully');
    console.log(`   Order ID: ${updateData.order._id}`);
    console.log(`   New Status: ${updateData.order.status}`);
    console.log(`   Updated By: ${updateData.order.statusHistory[updateData.order.statusHistory.length - 1].updatedBy || 'Unknown'}`);

    // Step 4: Verify the update by fetching the order again
    console.log('🔍 Verifying update...');
    const verifyResponse = await fetch(`${baseUrl}/api/unit-manager/sales-orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!verifyResponse.ok) {
      throw new Error(`Verification fetch failed: ${verifyResponse.status}`);
    }

    const verifyData = await verifyResponse.json();
    const updatedOrder = verifyData.orders.find(order => order._id === pendingOrder._id);
    
    if (updatedOrder && updatedOrder.status === 'approved') {
      console.log('✅ Order status update verified successfully');
    } else {
      console.log('❌ Order status update verification failed');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the test
testOrderStatusUpdate();