// Test script to verify the production summary update fix

const testProductSummaryUpdate = async () => {
  try {
    const baseUrl = 'http://localhost:5000';
    
    // Step 1: Login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log(`✅ Login successful for user: ${loginData.user?.username}`);

    // Step 2: Test the update endpoint with the exact same data that failed
    console.log('🧪 Testing product summary update...');
    const updateResponse = await fetch(`${baseUrl}/api/sales/update-product-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        "date": "2025-11-25",
        "productId": "68bff35e71ef51a68b5d7ab6",
        "updates": {
            "packing": 0,
            "physicalStock": 0,
            "batchAdjusted": 0,
            "qtyPerBatch": 1
        }
      })
    });

    const updateData = await updateResponse.json();
    
    if (updateResponse.ok) {
      console.log('✅ Update successful!');
      console.log('Response:', JSON.stringify(updateData, null, 2));
    } else {
      console.log('❌ Update failed:');
      console.log('Status:', updateResponse.status);
      console.log('Error:', JSON.stringify(updateData, null, 2));
    }

    // Step 3: Test with different values
    console.log('\n🧪 Testing with different values...');
    const updateResponse2 = await fetch(`${baseUrl}/api/sales/update-product-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        "date": "2025-11-25",
        "productId": "68bff35e71ef51a68b5d7ab6",
        "updates": {
            "packing": 50,
            "physicalStock": 100,
            "batchAdjusted": 5.5,
            "qtyPerBatch": 200
        }
      })
    });

    const updateData2 = await updateResponse2.json();
    
    if (updateResponse2.ok) {
      console.log('✅ Second update successful!');
      console.log('Calculated values:');
      console.log(`  - Production Final Batches: ${updateData2.summary?.productionFinalBatches}`);
      console.log(`  - To Be Produced Day: ${updateData2.summary?.toBeProducedDay}`);
      console.log(`  - To Be Produced Batches: ${updateData2.summary?.toBeProducedBatches}`);
      console.log(`  - Expiry Shortage: ${updateData2.summary?.expiryShortage}`);
      console.log(`  - Balance Final Batches: ${updateData2.summary?.balanceFinalBatches}`);
    } else {
      console.log('❌ Second update failed:');
      console.log('Error:', JSON.stringify(updateData2, null, 2));
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

// Run the test
testProductSummaryUpdate();