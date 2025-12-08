import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testExactMatch() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    // Test exact name match
    const exactMatch = await Item.findOne({
      name: "Every Day Bombay PAV 200g (RRL)",
      store: "6914090118cf85f80ad856bc"
    });
    
    if (exactMatch) {
      console.log('✅ Found item with exact name match:');
      console.log(`   Name: "${exactMatch.name}"`);
      console.log(`   Category: ${exactMatch.category}`);
      console.log(`   Code: ${exactMatch.code}`);
      console.log(`   Store: ${exactMatch.store}`);
      
      // Now test our enhanced duplicate checking
      const duplicateQuery = {
        name: { $regex: new RegExp(`^Every Day Bombay PAV 200g \\(RRL\\)$`, 'i') },
        category: exactMatch.category,
        store: exactMatch.store
      };
      
      console.log('\n🔍 Testing enhanced duplicate check:');
      console.log('Query:', JSON.stringify(duplicateQuery, null, 2));
      
      const duplicateCheck = await Item.findOne(duplicateQuery);
      
      if (duplicateCheck) {
        console.log('✅ Enhanced duplicate checking WORKS!');
        console.log(`   Found: ${duplicateCheck.code} in category "${duplicateCheck.category}"`);
      } else {
        console.log('❌ Enhanced duplicate checking failed');
      }
      
      // Test different category - should NOT find
      console.log('\n🧪 Testing with different category (should NOT find):');
      const differentCategoryQuery = {
        name: { $regex: new RegExp(`^Every Day Bombay PAV 200g \\(RRL\\)$`, 'i') },
        category: "Breads", // Different category
        store: exactMatch.store
      };
      
      const differentCategoryResult = await Item.findOne(differentCategoryQuery);
      
      if (differentCategoryResult) {
        console.log('❌ ERROR: Found item in different category (should not happen)');
      } else {
        console.log('✅ CORRECT: No item found in different category - creation would be allowed');
      }
      
    } else {
      console.log('❌ No exact match found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testExactMatch();