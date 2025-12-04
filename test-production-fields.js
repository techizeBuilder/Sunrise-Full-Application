// Test script to verify ProductDailySummary fields in production APIs
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

// Test production shift data API
async function testProductionShiftData() {
  try {
    console.log('🧪 Testing Production Shift Data API...');
    
    const response = await fetch(`${BASE_URL}/production/shift-data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real test, you'd need proper auth token
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Production shift data response structure:');
      
      if (data.data?.groups?.length > 0) {
        const firstGroup = data.data.groups[0];
        console.log('📦 First group structure:', {
          name: firstGroup.name,
          totalItems: firstGroup.totalItems,
          itemsCount: firstGroup.items?.length || 0
        });
        
        if (firstGroup.items?.length > 0) {
          const firstItem = firstGroup.items[0];
          console.log('🔍 First item fields:', {
            name: firstItem.name,
            hasProductionFinalBatches: 'productionFinalBatches' in firstItem,
            hasQtyPerBatch: 'qtyPerBatch' in firstItem,
            productionFinalBatches: firstItem.productionFinalBatches,
            qtyPerBatch: firstItem.qtyPerBatch
          });
        }
      }
    } else {
      console.log('❌ Production shift data API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Production shift data test error:', error.message);
  }
}

// Test ungrouped items API
async function testUngroupedItems() {
  try {
    console.log('\n🧪 Testing Ungrouped Items API...');
    
    const response = await fetch(`${BASE_URL}/production/ungrouped-items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real test, you'd need proper auth token
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ungrouped items response structure:');
      console.log('📊 Summary:', {
        totalItems: data.data?.totalItems,
        ungroupedItemsCount: data.data?.ungroupedItemsCount,
        itemsCount: data.data?.items?.length || 0
      });
      
      if (data.data?.items?.length > 0) {
        const firstItem = data.data.items[0];
        console.log('🔍 First ungrouped item fields:', {
          name: firstItem.name,
          hasProductionFinalBatches: 'productionFinalBatches' in firstItem,
          hasQtyPerBatch: 'qtyPerBatch' in firstItem,
          productionFinalBatches: firstItem.productionFinalBatches,
          qtyPerBatch: firstItem.qtyPerBatch
        });
      }
    } else {
      console.log('❌ Ungrouped items API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Ungrouped items test error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Production API Fields Test...\n');
  
  await testProductionShiftData();
  await testUngroupedItems();
  
  console.log('\n✅ Production API fields test completed!');
  console.log('📋 Expected fields added to both APIs:');
  console.log('   - productionFinalBatches: Production with final batches');
  console.log('   - qtyPerBatch: Qty/Batch');
}

runTests().catch(console.error);