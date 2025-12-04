// Test ProductDailySummary qtyPerBatch calculation fix
import mongoose from 'mongoose';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testQtyPerBatchCalculation() {
  console.log('🧪 Testing ProductDailySummary qtyPerBatch calculation fix...\n');
  
  try {
    // Test the production groups API
    console.log('🔍 Testing production groups API...');
    const response = await fetch(`${BASE_URL}/unit-head/production-groups`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add proper Authorization header for real testing
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Production groups response received');
      console.log('📊 Groups found:', data.data?.length || 0);
      
      if (data.data && data.data.length > 0) {
        data.data.forEach((group, index) => {
          console.log(`\n📦 Group ${index + 1}: "${group.name}"`);
          console.log(`   📈 qtyPerBatch: ${group.qtyPerBatch}`);
          console.log(`   🏷️  Items: ${group.items?.length || 0}`);
          
          if (group.items && group.items.length > 0) {
            group.items.forEach((item, itemIndex) => {
              console.log(`   └─ Item ${itemIndex + 1}: ${item.name} (${item.code})`);
            });
          }
        });
      }
    } else {
      console.log('❌ API call failed:', response.status, response.statusText);
    }

    console.log('\n🎯 Expected behavior:');
    console.log('   - qtyPerBatch should be calculated from ProductDailySummary.qtyPerBatch');
    console.log('   - Should use the MAXIMUM value among all items (600 if items have 600 and 321)');
    console.log('   - Should NOT use inventory quantity or hardcoded 100');
    
    console.log('\n📝 Debug tips:');
    console.log('   1. Check server console for ProductDailySummary query logs');
    console.log('   2. Look for "📊 ProductDailySummary data found:" messages');
    console.log('   3. Verify "🎯 Calculated qtyPerBatch" shows correct max value');

  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

// Test individual group API if ID is provided
async function testSingleGroup(groupId) {
  console.log(`\n🔍 Testing single group API for ID: ${groupId}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/unit-head/production-groups/${groupId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add proper Authorization header for real testing
        // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Single group response received');
      console.log('📦 Group:', data.group?.name || 'Unknown');
      console.log('📈 qtyPerBatch:', data.group?.qtyPerBatch || 0);
      console.log('🏷️  Items:', data.group?.items?.length || 0);
    } else {
      console.log('❌ Single group API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Single group test error:', error.message);
  }
}

// Run tests
console.log('🚀 Starting ProductDailySummary qtyPerBatch calculation test...\n');
testQtyPerBatchCalculation();

// Uncomment to test specific group ID
// testSingleGroup('69314e783962ee5e4021362b');