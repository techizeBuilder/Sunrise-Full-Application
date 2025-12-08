/**
 * Script to test inventory items for a specific store and investigate pagination issue
 * Store ID: 6914090118cf85f80ad856bc
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Item } from './server/models/Inventory.js';
import { Company } from './server/models/Company.js';

// Load environment variables
dotenv.config();

const STORE_ID = '6914090118cf85f80ad856bc';
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://sunrise-manufacturing.onrender.com' 
  : 'http://localhost:5000';

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

async function testStoreInventory() {
  try {
    console.log('🔍 Testing Store Inventory');
    console.log('===========================\n');
    
    // 1. First, check if the store exists
    console.log('1️⃣ Checking Store/Company Information:');
    const store = await Company.findById(STORE_ID);
    if (store) {
      console.log(`✅ Store Found: ${store.name}`);
      console.log(`   📍 Location: ${store.city}, ${store.state}`);
      console.log(`   🏢 Type: ${store.type || 'Not specified'}`);
      console.log(`   📧 Email: ${store.email || 'Not specified'}`);
    } else {
      console.log('❌ Store not found in database');
      return;
    }
    
    console.log('\n');
    
    // 2. Count total items in this store
    console.log('2️⃣ Counting Total Items in Store:');
    const totalCount = await Item.countDocuments({ store: STORE_ID });
    console.log(`📦 Total items in store: ${totalCount}`);
    
    // 3. Count by different criteria
    console.log('\n3️⃣ Item Breakdown:');
    
    // Count by type
    const typeStats = await Item.aggregate([
      { $match: { store: STORE_ID } },
      { 
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('📊 By Type:');
    typeStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} items`);
    });
    
    // Count by category
    const categoryStats = await Item.aggregate([
      { $match: { store: STORE_ID } },
      { 
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 By Category:');
    categoryStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} items`);
    });
    
    console.log('\n');
    
    // 4. Test API simulation with different pagination
    console.log('4️⃣ Testing Different Pagination Limits:');
    
    const limits = [10, 20, 50, 100, 200];
    
    for (const limit of limits) {
      const items = await Item.find({ store: STORE_ID })
        .sort({ createdAt: -1 })
        .limit(limit);
      
      console.log(`   Limit ${limit}: Retrieved ${items.length} items`);
    }
    
    console.log('\n');
    
    // 5. Simulate the exact API call
    console.log('5️⃣ Simulating API Call (/api/super-admin/inventory/items):');
    
    const page = 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // This mimics the exact query from inventoryController.js
    let query = { store: STORE_ID };
    
    const items = await Item.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    console.log(`   🔎 Query: ${JSON.stringify(query)}`);
    console.log(`   📄 Page: ${page}, Limit: ${limit}, Skip: ${skip}`);
    console.log(`   📦 Retrieved: ${items.length} items`);
    console.log(`   📊 Total in DB: ${totalCount} items`);
    
    if (items.length > 0) {
      console.log('\n📋 Sample Retrieved Items:');
      items.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} (${item.code}) - ${item.category}`);
      });
      if (items.length > 5) {
        console.log(`   ... and ${items.length - 5} more items`);
      }
    }
    
    console.log('\n');
    
    // 6. Test with no filters
    console.log('6️⃣ Testing Without Store Filter (All Items):');
    const allItems = await Item.find({})
      .sort({ createdAt: -1 })
      .limit(20);
    
    console.log(`   📦 Retrieved: ${allItems.length} items from all stores`);
    
    const totalAllItems = await Item.countDocuments({});
    console.log(`   📊 Total items in entire DB: ${totalAllItems}`);
    
    console.log('\n');
    
    // 7. Check if there are any issues with the store field
    console.log('7️⃣ Investigating Store Field Issues:');
    
    const storeFieldTypes = await Item.aggregate([
      { $match: { store: { $exists: true } } },
      {
        $project: {
          storeType: { $type: '$store' },
          storeValue: '$store'
        }
      },
      {
        $group: {
          _id: '$storeType',
          count: { $sum: 1 },
          sampleValues: { $addToSet: '$storeValue' }
        }
      }
    ]);
    
    console.log('🔍 Store Field Analysis:');
    storeFieldTypes.forEach(stat => {
      console.log(`   Type: ${stat._id}, Count: ${stat.count}`);
      console.log(`   Sample values: ${stat.sampleValues.slice(0, 3).join(', ')}`);
    });
    
    // Check for items with the exact store ID
    const exactMatches = await Item.find({ 
      store: { $regex: new RegExp(STORE_ID, 'i') }
    }).limit(5);
    
    console.log(`\n🎯 Items matching store ID pattern: ${exactMatches.length}`);
    if (exactMatches.length > 0) {
      exactMatches.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} - Store: ${item.store}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing store inventory:', error);
  }
}

async function testAPIEndpoint() {
  try {
    console.log('\n8️⃣ Testing Actual API Endpoint:');
    console.log('=====================================\n');
    
    // Test the actual API endpoint if possible
    const testUrl = `${API_BASE}/api/super-admin/inventory/items?page=1&limit=20`;
    
    console.log(`🌐 Testing URL: ${testUrl}`);
    console.log('⚠️ Note: This requires authentication. Testing database query only.\n');
    
    // Simulate what the API does
    const page = 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    // No store filter for Super Admin
    let query = {};
    
    const items = await Item.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Item.countDocuments(query);
    
    console.log('🔍 Super Admin API Simulation Results:');
    console.log(`   📄 Page: ${page}, Limit: ${limit}`);
    console.log(`   📦 Retrieved: ${items.length} items`);
    console.log(`   📊 Total items: ${total}`);
    console.log(`   📄 Total pages: ${Math.ceil(total / limit)}`);
    
    // Check how many items are from our specific store
    const storeItems = items.filter(item => item.store === STORE_ID);
    console.log(`   🏢 Items from store ${STORE_ID}: ${storeItems.length}/${items.length}`);
    
    if (storeItems.length > 0) {
      console.log('\n📋 Items from target store in first 20:');
      storeItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} (${item.code})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing API endpoint:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting Store Inventory Investigation');
    console.log(`🎯 Target Store ID: ${STORE_ID}`);
    console.log('==========================================\n');
    
    await connectToDatabase();
    await testStoreInventory();
    await testAPIEndpoint();
    
    console.log('\n✅ Investigation Complete!');
    console.log('=======================================');
    console.log('🔍 Summary:');
    console.log('- Check the "Total items in store" count above');
    console.log('- If items exist but API returns only 20, it\'s normal pagination');
    console.log('- Super Admin sees all items, not filtered by store');
    console.log('- Use pagination (page parameter) to see more items');
    console.log('- Consider adding store filtering if needed');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from database');
    }
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { testStoreInventory, testAPIEndpoint };