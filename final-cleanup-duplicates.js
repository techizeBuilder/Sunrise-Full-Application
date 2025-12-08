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

const removeExactDuplicates = async () => {
  try {
    console.log('🧹 Removing exact duplicate items...\n');

    // The 3 exact duplicates identified
    const duplicateIds = [
      "693673ab7b4806d74e2c7514", // PRO0020 - Everyday PremiumSoft Milk Bread 400g (RRL) - Duplicate
      "693673ac7b4806d74e2c7523", // PRO0021 - Everyday Premium Sandwich bread 400g (RRL) - Duplicate  
      "693673ad7b4806d74e2c7539"  // PRO0022 - Every Day Bombay PAV 200g (RRL) - Duplicate
    ];

    console.log('🗑️ Deleting the following duplicate items:');
    
    // Show what will be deleted
    for (const id of duplicateIds) {
      const item = await Item.findById(id);
      if (item) {
        console.log(`   - ${item.code}: "${item.name}" (Created: ${new Date(item.createdAt).toLocaleString()})`);
      }
    }

    // Delete the duplicates
    const deleteResult = await Item.deleteMany({
      _id: { $in: duplicateIds }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.deletedCount} duplicate items!`);

    // Verify cleanup
    const remainingCount = await Item.countDocuments();
    console.log(`📊 Total items remaining: ${remainingCount}`);

    // Verify no duplicates remain
    const duplicatesCheck = await Item.aggregate([
      {
        $group: {
          _id: {
            name: { $toLower: "$name" },
            category: "$category", 
            type: "$type",
            store: "$store"
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicatesCheck.length === 0) {
      console.log('🎉 No duplicate items remain in database!');
      console.log('\n✅ Your duplicate prevention should now work perfectly:');
      console.log('   - Import file once: Creates items normally');
      console.log('   - Import same file again: Blocks ALL items as duplicates');
    } else {
      console.log(`⚠️ ${duplicatesCheck.length} duplicate groups still remain`);
    }

  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
  }
};

// Run the cleanup
const run = async () => {
  await connectDB();
  await removeExactDuplicates();
  await mongoose.disconnect();
  console.log('\n✅ Cleanup completed and database connection closed.');
};

run().catch(console.error);