import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testDuplicatePreventionAfterFix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB for duplicate prevention testing');

    // Test the duplicate prevention logic by simulating the createItem duplicate check
    const testItemName = "Every Day Bombay PAV 200g (RRL)"; // This item exists
    const testStore = "6914090118cf85f80ad856bc"; // Sunrise Foods Tirupati

    console.log(`\n🧪 Testing duplicate check for: "${testItemName}"`);
    console.log(`   Store: ${testStore}`);

    // Simulate the query that would be used in createItem function
    const trimmedName = testItemName.trim();
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') }
    };
    
    // Add store-based filtering (simulating when companyIdForCheck is not available)
    query.store = testStore;
    
    console.log('🔍 Duplicate check query:', JSON.stringify(query, null, 2));
    
    const existingItem = await Item.findOne(query);
    
    if (existingItem) {
      console.log('✅ DUPLICATE DETECTION WORKING! Found existing item:');
      console.log(`   ID: ${existingItem._id}`);
      console.log(`   Name: "${existingItem.name}"`);
      console.log(`   Code: ${existingItem.code}`);
      console.log(`   Store: ${existingItem.store}`);
      console.log(`   CompanyId: ${existingItem.companyId || 'NOT_SET'}`);
      console.log(`   Created: ${new Date(existingItem.createdAt).toLocaleString()}`);
    } else {
      console.log('❌ NO DUPLICATE DETECTED - This suggests an issue with the query');
    }

    // Test 2: Check current state of all items with this name
    console.log(`\n🔍 Current database state for "${testItemName}":`)
    const allMatchingItems = await Item.find({
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      store: testStore
    });
    
    console.log(`Found ${allMatchingItems.length} items with this name and store:`);
    allMatchingItems.forEach((item, index) => {
      console.log(`   ${index + 1}. Code: ${item.code}, CompanyId: ${item.companyId || 'NOT_SET'}, Created: ${new Date(item.createdAt).toLocaleString()}`);
    });

    // Test 3: Test with companyId-based filtering (for when companyId is available)
    console.log(`\n🧪 Testing with companyId-based filtering:`);
    const companyIdQuery = {
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      $or: [
        { companyId: testStore },
        { store: testStore }
      ]
    };
    
    console.log('🔍 CompanyId-based query:', JSON.stringify(companyIdQuery, null, 2));
    
    const existingItemCompanyCheck = await Item.findOne(companyIdQuery);
    
    if (existingItemCompanyCheck) {
      console.log('✅ COMPANY-BASED DUPLICATE DETECTION WORKING! Found existing item:');
      console.log(`   Code: ${existingItemCompanyCheck.code}, CompanyId: ${existingItemCompanyCheck.companyId || 'NOT_SET'}`);
    } else {
      console.log('❌ NO DUPLICATE DETECTED with company-based query');
    }

  } catch (error) {
    console.error('❌ Error testing duplicate prevention:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDuplicatePreventionAfterFix();