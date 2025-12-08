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

const cleanupDuplicates = async () => {
  try {
    console.log('🧹 Finding and cleaning up duplicate items...\n');

    // Find all duplicates based on name + category + type + store
    const duplicates = await Item.aggregate([
      {
        $group: {
          _id: {
            name: { $toLower: "$name" },
            category: "$category",
            type: "$type",
            store: "$store"
          },
          items: {
            $push: {
              id: "$_id",
              name: "$name",
              code: "$code",
              createdAt: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicates.length === 0) {
      console.log('🎉 No duplicates found!');
      return;
    }

    console.log(`🚨 Found ${duplicates.length} duplicate groups:`);
    
    let totalToDelete = 0;
    const itemsToDelete = [];

    duplicates.forEach((dup, index) => {
      const { name, category, type, store } = dup._id;
      const items = dup.items;
      
      console.log(`\n${index + 1}. "${name}" (${category}, ${type})`);
      console.log(`   Store: ${store}`);
      console.log(`   Count: ${items.length} duplicates`);
      
      // Sort by creation date (keep oldest)
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      console.log(`   Keeping: ${items[0].code} (${items[0].name}) - Created: ${new Date(items[0].createdAt).toLocaleDateString()}`);
      
      // Mark others for deletion
      const toDelete = items.slice(1);
      toDelete.forEach(item => {
        console.log(`   Deleting: ${item.code} (${item.name}) - Created: ${new Date(item.createdAt).toLocaleDateString()}`);
        itemsToDelete.push(item.id);
      });
      
      totalToDelete += toDelete.length;
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Duplicate groups: ${duplicates.length}`);
    console.log(`   Items to delete: ${totalToDelete}`);
    console.log(`   Items to keep: ${duplicates.length}`);

    if (itemsToDelete.length > 0) {
      console.log('\n🗑️  Deleting duplicate items...');
      const deleteResult = await Item.deleteMany({
        _id: { $in: itemsToDelete }
      });
      
      console.log(`✅ Successfully deleted ${deleteResult.deletedCount} duplicate items!`);
      
      // Verify cleanup
      const remainingCount = await Item.countDocuments();
      console.log(`📊 Total items remaining: ${remainingCount}`);
    }

  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
  }
};

// Run the cleanup
const run = async () => {
  await connectDB();
  await cleanupDuplicates();
  await mongoose.disconnect();
  console.log('\n✅ Cleanup completed and database connection closed.');
};

run().catch(console.error);