// Quick test for bulk delete API endpoint
// Run this with: node test-bulk-delete-quick.js

const API_BASE = 'http://localhost:5000';

async function testBulkDeleteEndpoint() {
  console.log('🧪 Testing Bulk Delete API Endpoint...\n');

  // Test with sample data (these IDs probably don't exist, but should test the endpoint)
  const testData = {
    itemIds: [
      "692eafb6bc5d787593b620b7",
      "692e91aa4711dda25ec186aa", 
      "692e91ab4711dda25ec186b0"
    ]
  };

  console.log('Testing Super Admin endpoint...');
  console.log(`POST ${API_BASE}/api/super-admin/inventory/items/bulk-delete`);
  console.log('Request body:', JSON.stringify(testData, null, 2));

  try {
    const response = await fetch(`${API_BASE}/api/super-admin/inventory/items/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, you'd include authentication headers
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
      },
      body: JSON.stringify(testData)
    });

    console.log(`\n📡 Response Status: ${response.status}`);
    
    const result = await response.json();
    console.log('📄 Response Body:', JSON.stringify(result, null, 2));

    if (response.status === 401 || response.status === 403) {
      console.log('\n✅ API endpoint exists! (Authentication/Authorization required)');
    } else if (response.status === 404) {
      console.log('\n❌ API endpoint not found - route issue');
    } else if (response.status === 400 || response.status === 500) {
      console.log('\n✅ API endpoint exists! (Request processing issue)');
    } else {
      console.log('\n✅ API endpoint working!');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔴 Server not running. Please start the server first:');
      console.log('   npm run dev');
    } else {
      console.log('\n🚨 Network Error:', error.message);
    }
  }
}

// Test endpoints for all routes
async function testAllEndpoints() {
  const endpoints = [
    '/api/super-admin/inventory/items/bulk-delete',
    '/api/unit-head/inventory/items/bulk-delete',
    '/api/inventory/items/bulk-delete'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint}`);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: ['test'] })
      });
      
      console.log(`   Status: ${response.status}`);
      if (response.status === 404) {
        console.log('   ❌ Not Found');
      } else {
        console.log('   ✅ Endpoint exists');
      }
    } catch (error) {
      console.log(`   🚨 Error: ${error.message}`);
    }
  }
}

if (process.argv.includes('--all')) {
  testAllEndpoints();
} else {
  testBulkDeleteEndpoint();
}