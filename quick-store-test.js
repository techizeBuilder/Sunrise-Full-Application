/**
 * Simple script to test inventory items for store: 6914090118cf85f80ad856bc
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const STORE_ID = '6914090118cf85f80ad856bc';

// Simple Item schema for testing
const ItemSchema = new mongoose.Schema({
  name: String,
  code: String,
  category: String,
  store: String,
  type: String,
  qty: Number,
  createdAt: Date
}, { 
  collection: 'items',
  strict: false
});

const Item = mongoose.model('Item', ItemSchema);

// Simple Company schema
const CompanySchema = new mongoose.Schema({
  name: String,
  city: String,
  state: String
}, { 
  collection: 'companies',
  strict: false 
});

const Company = mongoose.model('Company', CompanySchema);

async function main() {
  try {
    console.log('🔍 Store Inventory Quick Test');
    console.log('==============================\n');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MONGODB_URI not found in .env file');
      return;
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');
    
    // Check if store exists
    console.log('1️⃣ Checking store information:');
    const store = await Company.findById(STORE_ID);
    if (store) {
      console.log(`✅ Store Found: ${store.name}`);
      console.log(`📍 Location: ${store.city}, ${store.state}\n`);
    } else {
      console.log('❌ Store not found in companies collection\n');
    }
    
    // Count total items in store
    console.log('2️⃣ Counting items in store:');
    const totalInStore = await Item.countDocuments({ store: STORE_ID });
    console.log(`📦 Total items in store ${STORE_ID}: ${totalInStore}\n`);
    
    // Count total items in database
    console.log('3️⃣ Counting all items in database:');
    const totalAllItems = await Item.countDocuments({});
    console.log(`📦 Total items in entire database: ${totalAllItems}\n`);
    
    // Test pagination - get first 20 items (no store filter - Super Admin view)
    console.log('4️⃣ Testing Super Admin API (first 20 items, no store filter):');
    const superAdminItems = await Item.find({})
      .sort({ createdAt: -1 })
      .limit(20);
    console.log(`📄 Retrieved: ${superAdminItems.length} items`);
    
    // Check how many are from our target store
    const targetStoreItems = superAdminItems.filter(item => item.store === STORE_ID);
    console.log(`🎯 Items from target store in first 20: ${targetStoreItems.length}\n`);
    
    if (targetStoreItems.length > 0) {
      console.log('📋 Items from target store:');
      targetStoreItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name || 'Unnamed'} (${item.code || 'No Code'})`);
      });
      console.log('');
    }
    
    // Test with store filter
    console.log('5️⃣ Testing with store filter (like Unit Head would see):');
    const storeFilteredItems = await Item.find({ store: STORE_ID })
      .sort({ createdAt: -1 })
      .limit(20);
    console.log(`📄 Retrieved: ${storeFilteredItems.length} items from specific store\n`);
    
    if (storeFilteredItems.length > 0) {
      console.log('📋 Items from store (filtered view):');
      storeFilteredItems.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name || 'Unnamed'} (${item.code || 'No Code'})`);
      });
      if (storeFilteredItems.length > 5) {
        console.log(`   ... and ${storeFilteredItems.length - 5} more items\n`);
      }
    }
    
    // Analyze store field values
    console.log('6️⃣ Analyzing store field patterns:');
    const storePatterns = await Item.aggregate([
      { $match: { store: { $exists: true } } },
      { 
        $group: {
          _id: '$store',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log('🏪 Top 10 store values by item count:');
    storePatterns.forEach(pattern => {
      const isTargetStore = pattern._id === STORE_ID;
      console.log(`   ${isTargetStore ? '🎯' : '  '} ${pattern._id}: ${pattern.count} items`);
    });
    
    console.log('\n✅ Test Complete!');
    console.log('===================');
    
    if (totalInStore === 0) {
      console.log('🔍 ISSUE FOUND: No items found for this store ID');
      console.log('   Possible reasons:');
      console.log('   1. Store ID is incorrect');
      console.log('   2. Items use different store field format');
      console.log('   3. No items have been created for this store');
    } else {
      console.log(`🔍 ANALYSIS: Found ${totalInStore} items in store`);
      console.log(`   API showing only 20 items is normal pagination behavior`);
      console.log(`   Use page parameter to get more items (e.g., ?page=2&limit=20)`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

main().catch(console.error);