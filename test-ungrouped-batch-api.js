// Test script to verify ungrouped items API returns batchNo field properly
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Il9pZCI6IjY3M2QxMzM5ZGJmZWNiMmMzOWFiYTU5NiIsInVzZXJuYW1lIjoidW5pdG1hbmFnZXIiLCJlbWFpbCI6InVuaXRtYW5hZ2VyQGdtYWlsLmNvbSIsInJvbGUiOiJVbml0IE1hbmFnZXIiLCJjb21wYW55SWQiOiI2NzNkMTMzOWRiZmVjYjJjMzlhYmE1OTQifSwiaWF0IjoxNzMzOTc2NjU1LCJleHAiOjE3MzQwNjMwNTV9.t-DdWExIzc8VyWNUlRbHGzBGZKbvBfRPUk1q8rYR1qo';

async function testUngroupedItemsSheet() {
  try {
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
        });

        // Test if we can update with batchNo
        const firstItem = data.data.items[0];
        if (firstItem.batchNo) {
          console.log(`\n🔄 Testing production update with batchNo: ${firstItem.batchNo}`);
          await testUpdateProduction(firstItem.originalItemId, firstItem.batchNo);
        }
      } else {
        console.log('📝 No items returned. Check if there are ungrouped items with batchAdjusted > 0');
      }
    } else {
      console.error('❌ API returned error:', data.message);
    }

  } catch (error) {
    console.error('💥 Error testing API:', error.message);
  }
}

async function testUpdateProduction(itemId, batchNo) {
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
testUngroupedItemsSheet();