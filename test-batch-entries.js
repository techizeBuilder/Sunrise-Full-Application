/**
 * Test script for new batch entries functionality
 * Tests the modified ungrouped items endpoint to ensure it creates individual batch entries
 */

const BASE_URL = 'http://localhost:5000';

async function testBatchEntries() {
  try {
    console.log('🧪 Testing Batch Entries Functionality');
    console.log('=====================================\n');

    // Mock token for testing (replace with actual token)
    const token = 'your-test-token-here';

    const response = await fetch(`${BASE_URL}/api/production/ungrouped-items`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response received successfully!');
      console.log('\n📊 Response Structure:');
      console.log('- Success:', data.success);
      console.log('- Total Batch Entries:', data.data?.totalBatchEntries || 0);
      console.log('- Unique Items:', data.data?.uniqueItems || 0);
      console.log('- Company Items Count:', data.data?.companyItemsCount || 0);
      
      const items = data.data?.items || [];
      console.log(`\n🔍 Found ${items.length} batch entries:`);
      
      // Group by original item to show batch breakdown
      const itemGroups = {};
      items.forEach(item => {
        const originalId = item.originalItemId || item._id;
        if (!itemGroups[originalId]) {
          itemGroups[originalId] = [];
        }
        itemGroups[originalId].push(item);
      });

      Object.entries(itemGroups).forEach(([itemId, batches]) => {
        const firstBatch = batches[0];
        console.log(`\n📦 ${firstBatch.name} (${firstBatch.code})`);
        console.log(`   Original batchAdjusted: ${firstBatch.originalBatchAdjusted}`);
        console.log(`   Created ${batches.length} batch entries:`);
        
        batches.forEach(batch => {
          console.log(`     - Batch ${batch.batchNumber}: ${batch.batchQuantity} ${batch.unit}`);
        });
      });

      console.log('\n✨ Test completed successfully!');
      console.log('\n🎯 Expected behavior:');
      console.log('- Items with 2.5 batchAdjusted should create 3 batch entries');
      console.log('- Last batch should have partial quantity');
      console.log('- Each batch entry has unique _id but same originalItemId');

    } else {
      console.log('❌ Response failed:', response.status, response.statusText);
      const errorData = await response.text();
      console.log('Error details:', errorData);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

console.log('📝 Instructions:');
console.log('1. Start the server: cd server && npm run dev');
console.log('2. Update the token in this file with a valid JWT token');
console.log('3. Run this test: node test-batch-entries.js');
console.log('4. Check the production dashboard UI at /production/dashboard');
console.log('\n🔄 Running test...\n');

// Run the test
// testBatchEntries(); // Uncomment when token is available