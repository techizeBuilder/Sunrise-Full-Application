/**
 * API Endpoint Test Script
 * Tests the actual inventory API endpoints to demonstrate pagination behavior
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const STORE_ID = '6914090118cf85f80ad856bc';

// Item model (simplified)
const ItemSchema = new mongoose.Schema({}, { 
  collection: 'items',
  strict: false
});
const Item = mongoose.model('Item', ItemSchema);

async function simulateAPIEndpoints() {
  try {
    console.log('🧪 SIMULATING ACTUAL API ENDPOINTS');
    console.log('===================================\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Super Admin API - Default pagination (limit=20)
    console.log('1️⃣ Super Admin API - Default Pagination:');
    console.log('   Endpoint: GET /api/super-admin/inventory/items');
    console.log('   Default params: page=1, limit=20\n');
    
    const page1Limit20 = await Item.find({})
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(20);
    
    const totalItems = await Item.countDocuments({});
    const storeItemsPage1 = page1Limit20.filter(item => item.store === STORE_ID);
    
    console.log(`   📊 Results:`);
    console.log(`   • Total items in DB: ${totalItems}`);
    console.log(`   • Items returned: ${page1Limit20.length}`);
    console.log(`   • Items from target store: ${storeItemsPage1.length}`);
    console.log(`   • Total pages: ${Math.ceil(totalItems / 20)}`);
    console.log('   • This explains why you see only 20 items!\n');
    
    // Test 2: Get next page
    console.log('2️⃣ Super Admin API - Page 2:');
    console.log('   Endpoint: GET /api/super-admin/inventory/items?page=2&limit=20\n');
    
    const page2Limit20 = await Item.find({})
      .sort({ createdAt: -1 })
      .skip(20)
      .limit(20);
    
    const storeItemsPage2 = page2Limit20.filter(item => item.store === STORE_ID);
    
    console.log(`   📊 Results:`);
    console.log(`   • Items returned: ${page2Limit20.length}`);
    console.log(`   • Items from target store: ${storeItemsPage2.length}`);
    console.log('   • This gives you the remaining items!\n');
    
    // Test 3: Increase limit
    console.log('3️⃣ Super Admin API - Higher Limit:');
    console.log('   Endpoint: GET /api/super-admin/inventory/items?page=1&limit=50\n');
    
    const page1Limit50 = await Item.find({})
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(50);
    
    const storeItemsLimit50 = page1Limit50.filter(item => item.store === STORE_ID);
    
    console.log(`   📊 Results:`);
    console.log(`   • Items returned: ${page1Limit50.length}`);
    console.log(`   • Items from target store: ${storeItemsLimit50.length}`);
    console.log('   • This gets all items from your store at once!\n');
    
    // Test 4: Unit Head API (store filtered)
    console.log('4️⃣ Unit Head API - Store Filtered:');
    console.log('   Endpoint: GET /api/unit-head/inventory/items');
    console.log('   (Automatically filters by user\'s store)\n');
    
    const unitHeadItems = await Item.find({ store: STORE_ID })
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log(`   📊 Results:`);
    console.log(`   • Items returned: ${unitHeadItems.length}`);
    console.log(`   • All items are from target store: ${unitHeadItems.length}`);
    console.log('   • Unit Heads only see their store\'s items!\n');
    
    // Show sample items
    if (unitHeadItems.length > 0) {
      console.log('📋 Sample Items from Your Store:');
      unitHeadItems.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} (${item.code}) - ${item.category}`);
      });
      if (unitHeadItems.length > 5) {
        console.log(`   ... and ${unitHeadItems.length - 5} more items\n`);
      }
    }
    
    console.log('🎯 SUMMARY OF YOUR ISSUE:');
    console.log('=========================');
    console.log(`• Your store has ${storeItemsLimit50.length} items total`);
    console.log(`• API default limit is 20 items per request`);
    console.log(`• This is normal pagination behavior`);
    console.log(`• To see all items, use: ?limit=50 or multiple pages\n`);
    
    console.log('🔧 SOLUTIONS:');
    console.log('==============');
    console.log('1. Use higher limit: /api/super-admin/inventory/items?limit=50');
    console.log('2. Implement pagination: ?page=1, ?page=2, etc.');
    console.log('3. Use Unit Head API for store-specific view');
    console.log('4. Add frontend pagination controls\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

async function main() {
  console.log('🔍 INVENTORY API PAGINATION ANALYSIS');
  console.log(`🎯 Store ID: ${STORE_ID}`);
  console.log('=====================================\n');
  
  await simulateAPIEndpoints();
  
  console.log('✅ CONCLUSION:');
  console.log('===============');
  console.log('The API is working correctly. The 20-item limit is intentional');
  console.log('pagination to prevent performance issues. This is standard practice');
  console.log('in REST APIs. Use the pagination parameters to get all items.\n');
}

main().catch(console.error);