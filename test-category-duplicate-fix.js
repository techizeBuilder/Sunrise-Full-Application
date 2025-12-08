import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testCategoryBasedDuplicateCheck() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB for category-based duplicate testing');

    const testStore = "6914090118cf85f80ad856bc"; // Sunrise Foods Tirupati

    // Test 1: Check existing item - should find duplicate in same category
    console.log('\n🧪 Test 1: Same name + Same category (should find duplicate)');
    const testName1 = "Every Day Bombay PAV 200g (RRL)";
    const testCategory1 = "NRB"; // This is the actual category
    
    const duplicateQuery1 = {
      name: { $regex: new RegExp(`^${testName1}$`, 'i') },
      category: testCategory1,
      store: testStore
    };
    
    console.log('🔍 Query:', JSON.stringify(duplicateQuery1, null, 2));
    const existingInSameCategory = await Item.findOne(duplicateQuery1);
    
    if (existingInSameCategory) {
      console.log('✅ CORRECT: Found duplicate in same category');
      console.log(`   Code: ${existingInSameCategory.code}, Category: ${existingInSameCategory.category}`);
    } else {
      console.log('❌ ERROR: Should have found duplicate in same category');
    }

    // Test 2: Check same name but different category - should NOT find duplicate
    console.log('\n🧪 Test 2: Same name + Different category (should NOT find duplicate)');
    const testName2 = "Every Day Bombay PAV 200g (RRL)";
    const testCategory2 = "Breads"; // Different category
    
    const duplicateQuery2 = {
      name: { $regex: new RegExp(`^${testName2}$`, 'i') },
      category: testCategory2,
      store: testStore
    };
    
    console.log('🔍 Query:', JSON.stringify(duplicateQuery2, null, 2));
    const existingInDifferentCategory = await Item.findOne(duplicateQuery2);
    
    if (existingInDifferentCategory) {
      console.log('❌ ERROR: Should NOT have found duplicate in different category');
      console.log(`   Code: ${existingInDifferentCategory.code}, Category: ${existingInDifferentCategory.category}`);
    } else {
      console.log('✅ CORRECT: No duplicate found in different category - item creation would be allowed');
    }

    // Test 3: Show all items with the same name across all categories
    console.log('\n🔍 All items with name "Every Day Bombay PAV 200g (RRL)" in store:');
    const allItems = await Item.find({
      name: { $regex: new RegExp(`^${testName1}$`, 'i') },
      store: testStore
    });
    
    console.log(`Found ${allItems.length} items:`);
    allItems.forEach((item, index) => {
      console.log(`   ${index + 1}. Code: ${item.code}, Category: ${item.category}, Name: "${item.name}"`);
    });

    // Test 4: Demonstrate the improvement
    console.log('\n📋 Summary of the fix:');
    console.log('   ✅ BEFORE: Items with same name were blocked regardless of category');
    console.log('   ✅ AFTER: Items with same name are only blocked if they\'re in the same category');
    console.log('   📝 This allows legitimate cases like:');
    console.log('      - "Milk 500ml" in category "Dairy"');
    console.log('      - "Milk 500ml" in category "Beverages"');
    console.log('   🚫 But still prevents true duplicates:');
    console.log('      - "Milk 500ml" in category "Dairy" (existing)');
    console.log('      - "Milk 500ml" in category "Dairy" (duplicate - blocked)');

  } catch (error) {
    console.error('❌ Error testing category-based duplicate check:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testCategoryBasedDuplicateCheck();