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

const checkActualState = async () => {
  try {
    console.log('🔍 Checking actual database state...\n');

    // Get a sample item to see its actual structure
    const sampleItem = await Item.findOne({ name: { $regex: /Everyday PremiumSoft Milk Bread 400g/i } });
    
    if (sampleItem) {
      console.log('📋 Sample item from database:');
      console.log('Raw object:', JSON.stringify(sampleItem.toObject(), null, 2));
      console.log('Direct field access:');
      console.log(`  _id: ${sampleItem._id}`);
      console.log(`  name: "${sampleItem.name}"`);
      console.log(`  companyId: ${sampleItem.companyId}`);
      console.log(`  store: ${sampleItem.store}`);
      console.log(`  category: "${sampleItem.category}"`);
      console.log(`  type: "${sampleItem.type}"`);
    }

    // Test actual duplicate query as it would run in import
    const testName = "Everyday PremiumSoft Milk Bread 400g";
    const testStore = "6914090118cf85f80ad856bc";
    
    console.log('\n🔎 Testing duplicate query...');
    const duplicateQuery = {
      name: { $regex: new RegExp(`^${testName}$`, 'i') },
      category: "Breads",
      type: "Product",
      $or: [
        { companyId: testStore },
        { store: testStore }
      ]
    };
    
    console.log('Query:', JSON.stringify(duplicateQuery, null, 2));
    
    const foundDuplicates = await Item.find(duplicateQuery);
    console.log(`\n🎯 Found ${foundDuplicates.length} items:`);
    
    foundDuplicates.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (${item.code})`);
      console.log(`   CompanyId: ${item.companyId}`);
      console.log(`   Store: ${item.store}`);
    });

    // Check if import would create duplicate
    if (foundDuplicates.length > 0) {
      console.log('\n✅ GOOD: Import would block this as duplicate');
    } else {
      console.log('\n❌ BAD: Import would allow this duplicate');
    }

  } catch (error) {
    console.error('❌ Error checking state:', error);
  }
};

// Run the check
const run = async () => {
  await connectDB();
  await checkActualState();
  await mongoose.disconnect();
  console.log('\n✅ Check completed.');
};

run().catch(console.error);