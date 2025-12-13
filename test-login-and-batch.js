// Login and test ungrouped items API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function loginAndTest() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'unitmanager',
        password: 'Cit@2021'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log('✅ Login successful!\n');

    // Test ungrouped items sheet API
    console.log('🔍 Testing /api/production/ungrouped-items-sheet...\n');
    
    const response = await fetch(`${BASE_URL}/api/production/ungrouped-items-sheet`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', data);
      return;
    }

    if (data.success) {
      console.log('✅ API Success!');
      console.log(`📊 Total items returned: ${data.data.items.length}`);
      console.log(`📦 Unique items: ${data.data.uniqueItems || 'N/A'}\n`);
      
      // Check first few items for batchNo field
      if (data.data.items.length > 0) {
        console.log('🔍 Checking batchNo field in response:');
        data.data.items.slice(0, 3).forEach((item, index) => {
          console.log(`\nItem ${index + 1}:`);
          console.log(`  - Name: ${item.name}`);
          console.log(`  - ID: ${item._id}`);
          console.log(`  - OriginalItemId: ${item.originalItemId}`);
          console.log(`  - batchNumber: ${item.batchNumber}`);
          console.log(`  - batchNo: ${item.batchNo || 'MISSING'} ${!item.batchNo ? '❌' : '✅'}`);
          console.log(`  - globalBatchNumber: ${item.globalBatchNumber || 'MISSING'}`);
          console.log(`  - batchAdjusted: ${item.originalBatchAdjusted}`);
        });

        // Test if we can update with batchNo
        const firstItem = data.data.items[0];
        if (firstItem.batchNo) {
          console.log(`\n🔄 Testing production update with batchNo: ${firstItem.batchNo}`);
          await testUpdateProduction(firstItem.originalItemId, firstItem.batchNo, token);
        }
        
        // Show all batch numbers
        console.log('\n📋 All batch numbers in response:');
        data.data.items.forEach((item, index) => {
          console.log(`${index + 1}. ${item.name} - ${item.batchNo || 'NO BATCHNO'}`);
        });
      } else {
        console.log('📝 No items returned. Check if there are ungrouped items with batchAdjusted > 0');
      }
    } else {
      console.error('❌ API returned error:', data.message);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function testUpdateProduction(itemId, batchNo, token) {
  try {
    console.log(`\n🔄 Testing production update for item ${itemId} with batchNo ${batchNo}...`);
    
    const updateData = {
      itemId: itemId,
      field: 'mouldingTime',
      value: new Date().toISOString(),
      batchno: batchNo
    };

    console.log('📤 Update payload:', updateData);

    const response = await fetch(`${BASE_URL}/api/production/ungrouped-items/production`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Production update successful!');
      console.log('📋 Updated data:', result.data);
    } else {
      console.error('❌ Production update failed:', result.message);
    }

  } catch (error) {
    console.error('💥 Error updating production:', error.message);
  }
}

// Run the test
loginAndTest();