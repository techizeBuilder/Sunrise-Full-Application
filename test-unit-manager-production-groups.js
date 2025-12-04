// Test Unit Manager Production Group APIs with qtyPerBatch calculation
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testUnitManagerProductionGroupAPIs() {
  console.log('🧪 Testing Unit Manager Production Group APIs...\n');
  
  try {
    // Test 1: List all production groups for unit manager
    console.log('🔍 1. Testing GET /unit-manager/production-groups');
    const listResponse = await fetch(`${BASE_URL}/unit-manager/production-groups`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add proper Authorization header for real testing
        // 'Authorization': 'Bearer YOUR_UNIT_MANAGER_TOKEN_HERE'
      }
    });

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('✅ List API working');
      console.log('📊 Groups found:', listData.groups?.length || 0);
      
      if (listData.groups && listData.groups.length > 0) {
        listData.groups.forEach((group, index) => {
          console.log(`   📦 Group ${index + 1}: "${group.name}"`);
          console.log(`      📈 qtyPerBatch: ${group.qtyPerBatch} (should be from ProductDailySummary max value)`);
          console.log(`      🏷️  Items: ${group.items?.length || 0}`);
        });
      }
    } else {
      console.log('❌ List API failed:', listResponse.status, await listResponse.text());
    }

    console.log('\n🔍 2. Testing GET /unit-manager/production-groups/{id}');
    // Test 2: Get specific group (using the ID from your request)
    const groupId = '6931548a1be50151d8d2e38d';
    const getResponse = await fetch(`${BASE_URL}/unit-manager/production-groups/${groupId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add proper Authorization header for real testing
        // 'Authorization': 'Bearer YOUR_UNIT_MANAGER_TOKEN_HERE'
      }
    });

    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ Get single group API working');
      console.log('📦 Group:', getData.group?.name || 'Unknown');
      console.log('📈 qtyPerBatch:', getData.group?.qtyPerBatch || 0);
      console.log('🏷️  Items:', getData.group?.items?.length || 0);
      
      if (getData.group?.items) {
        getData.group.items.forEach((item, index) => {
          console.log(`   └─ Item ${index + 1}: ${item.name}`);
        });
      }
    } else {
      console.log('❌ Get single group API failed:', getResponse.status, await getResponse.text());
    }

    console.log('\n📝 Expected behavior:');
    console.log('   ✅ Unit Manager should have same access as Unit Head');
    console.log('   ✅ qtyPerBatch calculated from ProductDailySummary.qtyPerBatch max value');
    console.log('   ✅ Should show 600 (not 100) if ProductDailySummary has 600 and 321');
    console.log('   ✅ No authorization errors for Unit Manager role');

    console.log('\n🚨 If seeing "Failed to update production group" error:');
    console.log('   1. Check server logs for actual error details');
    console.log('   2. Verify Unit Manager has proper company assignment');
    console.log('   3. Ensure ProductDailySummary records exist for the items');
    console.log('   4. Check if items belong to correct company/store');

  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

// Test update functionality (if needed)
async function testUnitManagerUpdateGroup(groupId, updateData) {
  console.log(`\n🔧 Testing PUT /unit-manager/production-groups/${groupId}`);
  
  try {
    const updateResponse = await fetch(`${BASE_URL}/unit-manager/production-groups/${groupId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add proper Authorization header for real testing
        // 'Authorization': 'Bearer YOUR_UNIT_MANAGER_TOKEN_HERE'
      },
      body: JSON.stringify(updateData)
    });

    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Update API working');
      console.log('📈 Updated qtyPerBatch:', updateResult.group?.qtyPerBatch || 0);
    } else {
      console.log('❌ Update API failed:', updateResponse.status, await updateResponse.text());
    }
  } catch (error) {
    console.log('❌ Update test error:', error.message);
  }
}

// Run tests
console.log('🚀 Starting Unit Manager Production Group API tests...\n');
testUnitManagerProductionGroupAPIs();

// Uncomment to test update with specific data
// testUnitManagerUpdateGroup('6931548a1be50151d8d2e38d', {
//   name: 'Test Group',
//   description: 'Test update',
//   items: ['some-item-id-1', 'some-item-id-2']
// });