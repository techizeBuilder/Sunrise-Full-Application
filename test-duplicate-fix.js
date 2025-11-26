// Test duplicate prevention fix
import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';

async function testDuplicateLogic() {
  try {
    // Connect to MongoDB
    const mongoURI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');
    console.log('\n🧪 Testing duplicate detection logic...');
    
    const testName = 'realcode';
    const testStore = '6914090118cf85f80ad856bc';
    
    // Test the fixed query logic
    const escapedName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
      $or: [
        { companyId: testStore },
        { store: testStore }
      ]
    };
    
    console.log('🔍 Test Query:', JSON.stringify(query, null, 2));
    
    const existingItems = await Item.find(query).select('name code companyId store');
    
    console.log('\n📋 Found matching items:');
    if (existingItems.length === 0) {
      console.log('❌ No duplicates found - this is wrong!');
    } else {
      console.log(`✅ Found ${existingItems.length} duplicate(s):`);
      existingItems.forEach(item => {
        console.log(`   - "${item.name}" (Code: ${item.code}) CompanyId: ${item.companyId || 'null'} Store: ${item.store || 'null'}`);
      });
    }
    
    console.log('\n🎯 Expected Result: Should find existing "realcode" items');
    console.log('✅ If duplicates are found, the fix is working!');
    
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await mongoose.disconnect();
  }
}

testDuplicateLogic();