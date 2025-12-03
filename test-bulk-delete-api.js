// Test script for bulk delete API
// Run with: node test-bulk-delete-api.js

const API_BASE = 'http://localhost:5000';

async function testBulkDeleteAPI() {
  try {
    console.log('🧪 Testing Super Admin Bulk Delete API...\n');

    // First, let's try to get some items to test with
    console.log('1️⃣ Getting inventory items...');
    const getItemsResponse = await fetch(`${API_BASE}/api/super-admin/inventory/items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, you'd need to include authentication headers
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
      }
    });

    if (!getItemsResponse.ok) {
      console.log('❌ Failed to get items (authentication required)');
      console.log('ℹ️ Please test this API with proper authentication in your frontend');
      return;
    }

    const itemsData = await getItemsResponse.json();
    console.log(`✅ Found ${itemsData.items?.length || 0} items`);

    if (!itemsData.items || itemsData.items.length < 2) {
      console.log('⚠️ Need at least 2 items to test bulk delete');
      return;
    }

    // Test bulk delete with first 2 items
    const testItemIds = itemsData.items.slice(0, 2).map(item => item._id);
    console.log(`\n2️⃣ Testing bulk delete with items: ${testItemIds.join(', ')}`);

    const bulkDeleteResponse = await fetch(`${API_BASE}/api/super-admin/inventory/items/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
      },
      body: JSON.stringify({
        itemIds: testItemIds
      })
    });

    const bulkDeleteResult = await bulkDeleteResponse.json();
    
    if (bulkDeleteResponse.ok) {
      console.log('✅ Bulk delete successful:');
      console.log(JSON.stringify(bulkDeleteResult, null, 2));
    } else {
      console.log('❌ Bulk delete failed:');
      console.log(JSON.stringify(bulkDeleteResult, null, 2));
    }

  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

// Test invalid scenarios
async function testInvalidScenarios() {
  console.log('\n🧪 Testing invalid scenarios...\n');

  const scenarios = [
    {
      name: 'Empty array',
      data: { itemIds: [] }
    },
    {
      name: 'Invalid item IDs',
      data: { itemIds: ['invalid-id', 'another-invalid'] }
    },
    {
      name: 'Missing itemIds field',
      data: {}
    },
    {
      name: 'Non-existent but valid IDs',
      data: { itemIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'] }
    }
  ];

  for (const scenario of scenarios) {
    console.log(`Testing: ${scenario.name}`);
    try {
      const response = await fetch(`${API_BASE}/api/super-admin/inventory/items/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario.data)
      });

      const result = await response.json();
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
      console.log(`Error: ${error.message}\n`);
    }
  }
}

// API Documentation
function printAPIDocumentation() {
  console.log(`
🔗 BULK DELETE API DOCUMENTATION
=================================

Endpoint: POST /api/super-admin/inventory/items/bulk-delete
Authentication: Required (Super Admin or Unit Head)

Request Body:
{
  "itemIds": ["item_id_1", "item_id_2", "item_id_3"]
}

Success Response (200):
{
  "success": true,
  "message": "Successfully deleted X items",
  "deletedCount": 3,
  "requestedCount": 3,
  "deletedItems": [
    { "id": "item_id_1", "name": "Item Name", "code": "ITEM001" }
  ]
}

Partial Success Response (200):
{
  "success": true,
  "message": "Successfully deleted 2 items",
  "deletedCount": 2,
  "requestedCount": 3,
  "warning": "1 item not found",
  "notFoundIds": ["non_existent_id"],
  "deletedItems": [...]
}

Error Responses:
- 400: Invalid input (empty array, invalid IDs)
- 403: Access denied (insufficient permissions)
- 404: No items found
- 500: Internal server error

Also available for Unit Head:
POST /api/unit-head/inventory/items/bulk-delete

And general inventory:
POST /api/inventory/items/bulk-delete
`);
}

// Run tests
if (process.argv.includes('--docs')) {
  printAPIDocumentation();
} else {
  console.log('🚀 Starting API tests...\n');
  testBulkDeleteAPI()
    .then(() => testInvalidScenarios())
    .then(() => {
      console.log('\n📚 For API documentation, run: node test-bulk-delete-api.js --docs');
      console.log('✅ Test complete! Please test with proper authentication in your frontend.');
    });
}