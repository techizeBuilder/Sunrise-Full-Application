import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_management_system');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Import Item model
const { Item } = await import('./server/models/Inventory.js');

const debugDuplicateLogic = async () => {
  try {
    console.log('🔍 Testing duplicate detection logic...\n');

    // Test with one of your items
    const testItem = {
      name: "Everyday PremiumSoft Milk Bread 400g",
      category: "Breads", 
      type: "Product",
      store: "6914090118cf85f80ad856bc"
    };

    console.log('📋 Test Item Details:');
    console.log(JSON.stringify(testItem, null, 2));
    console.log('');

    // Build the exact same duplicate query as import function
    const trimmedName = testItem.name.trim();
    const duplicateQuery = {
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      category: testItem.category,
      type: testItem.type
    };

    // Add location filtering
    duplicateQuery.$or = [
      { companyId: testItem.store },
      { store: testItem.store }
    ];

    console.log('🔎 Duplicate Query:');
    console.log(JSON.stringify(duplicateQuery, null, 2));
    console.log('');

    // Search for existing items
    const existingItems = await Item.find(duplicateQuery);
    
    console.log(`🎯 Found ${existingItems.length} matching items:`);
    if (existingItems.length > 0) {
      existingItems.forEach((item, index) => {
        console.log(`${index + 1}. Item Details:`);
        console.log(`   ID: ${item._id}`);
        console.log(`   Name: "${item.name}"`);
        console.log(`   Category: "${item.category}"`);
        console.log(`   Type: "${item.type}"`);
        console.log(`   CompanyId: ${item.companyId}`);
        console.log(`   Store: ${item.store}`);
        console.log(`   Code: ${item.code}`);
        console.log(`   Created: ${item.createdAt}`);
        console.log('');
      });
    } else {
      console.log('   ❌ NO DUPLICATES FOUND - This explains why duplicates are being created!');
    }

    // Let's also check what items actually exist in database
    console.log('\n📊 All items with similar names:');
    const similarItems = await Item.find({
      name: { $regex: new RegExp(testItem.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
    });

    if (similarItems.length > 0) {
      console.log(`Found ${similarItems.length} items with similar names:`);
      similarItems.forEach((item, index) => {
        console.log(`${index + 1}. "${item.name}" - Category: "${item.category}" - Type: "${item.type}" - Store: ${item.store} - CompanyId: ${item.companyId}`);
      });
    } else {
      console.log('No items found with similar names.');
    }

    // Check field by field comparison
    console.log('\n🔬 Detailed Field Analysis:');
    if (similarItems.length > 0) {
      const existing = similarItems[0];
      console.log('Field-by-field comparison:');
      console.log(`Name match: "${testItem.name}" === "${existing.name}" = ${testItem.name === existing.name}`);
      console.log(`Category match: "${testItem.category}" === "${existing.category}" = ${testItem.category === existing.category}`);
      console.log(`Type match: "${testItem.type}" === "${existing.type}" = ${testItem.type === existing.type}`);
      console.log(`Store match: "${testItem.store}" === "${existing.store}" = ${testItem.store === existing.store}`);
      console.log(`CompanyId match: "${testItem.store}" === "${existing.companyId}" = ${testItem.store === existing.companyId}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Run the test
const run = async () => {
  await connectDB();
  await debugDuplicateLogic();
  await mongoose.disconnect();
  console.log('\n✅ Database connection closed.');
};

run().catch(console.error);