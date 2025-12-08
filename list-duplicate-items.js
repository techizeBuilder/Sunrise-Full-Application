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

const findDuplicateItems = async () => {
  try {
    console.log('🔍 Searching for duplicate items...\n');

    // Find duplicates based on: name + category + type + location (same as validation logic)
    const duplicates = await Item.aggregate([
      {
        $group: {
          _id: {
            name: { $toLower: "$name" }, // Case insensitive grouping
            category: "$category",
            type: "$type",
            location: "$store" // Use store as location identifier
          },
          items: {
            $push: {
              id: "$_id",
              name: "$name",
              code: "$code",
              category: "$category",
              type: "$type",
              store: "$store",
              createdAt: "$createdAt",
              updatedAt: "$updatedAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Only groups with more than 1 item (duplicates)
        }
      },
      {
        $sort: {
          count: -1, // Sort by count descending (most duplicates first)
          "_id.name": 1 // Then by name
        }
      }
    ]);

    if (duplicates.length === 0) {
      console.log('🎉 No duplicate items found! All items are unique.');
      
      // Show summary of all items
      const totalItems = await Item.countDocuments();
      console.log(`\n📊 Database Summary:`);
      console.log(`   Total items: ${totalItems}`);
      
      // Show items by store
      const itemsByStore = await Item.aggregate([
        {
          $group: {
            _id: "$store",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      console.log(`   Items by store:`);
      itemsByStore.forEach(store => {
        console.log(`     Store ${store._id}: ${store.count} items`);
      });
      
      return;
    }

    console.log(`🚨 Found ${duplicates.length} duplicate item group(s):\n`);

    let totalDuplicates = 0;

    duplicates.forEach((duplicate, index) => {
      const { name, category, type, location } = duplicate._id;
      const items = duplicate.items;
      const duplicateCount = items.length;
      totalDuplicates += duplicateCount - 1; // Subtract 1 because one copy is legitimate

      console.log(`${index + 1}. DUPLICATE GROUP:`);
      console.log(`   Name: "${name}" (case insensitive match)`);
      console.log(`   Category: ${category}`);
      console.log(`   Type: ${type}`);
      console.log(`   Location (Store): ${location}`);
      console.log(`   Total Copies: ${duplicateCount} items\n`);

      console.log(`   📋 Duplicate Items Details:`);
      
      // Sort by creation date (oldest first)
      items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      items.forEach((item, itemIndex) => {
        const isOriginal = itemIndex === 0;
        const status = isOriginal ? '✅ KEEP (Original)' : '❌ DUPLICATE';
        
        console.log(`   ${itemIndex + 1}. ${status}`);
        console.log(`      Item ID: ${item.id}`);
        console.log(`      Name: "${item.name}" (exact case)`);
        console.log(`      Code: ${item.code}`);
        console.log(`      Store: ${item.store}`);
        console.log(`      Created: ${new Date(item.createdAt).toLocaleString()}`);
        console.log(`      Updated: ${new Date(item.updatedAt).toLocaleString()}`);
        console.log('');
      });

      console.log(`   🛠️  Cleanup Recommendation:`);
      console.log(`   - Keep: ${items[0].code} (${items[0].name}) - Oldest/Original`);
      if (items.length > 1) {
        const toDelete = items.slice(1);
        console.log(`   - Delete: ${toDelete.map(i => i.code).join(', ')}`);
        console.log(`   - MongoDB Delete Command:`);
        console.log(`     db.items.deleteMany({ _id: { $in: [${toDelete.map(i => `ObjectId("${i.id}")`).join(', ')}] } })`);
      }
      console.log('\n' + '─'.repeat(80) + '\n');
    });

    // Summary statistics
    console.log('📊 DUPLICATE ANALYSIS SUMMARY:');
    console.log(`   Duplicate groups found: ${duplicates.length}`);
    console.log(`   Total duplicate items to remove: ${totalDuplicates}`);
    console.log(`   Items to keep (originals): ${duplicates.length}`);
    
    const totalItems = await Item.countDocuments();
    console.log(`   Current database size: ${totalItems} items`);
    console.log(`   After cleanup: ${totalItems - totalDuplicates} items`);
    
  } catch (error) {
    console.error('❌ Error finding duplicate items:', error);
  }
};

// Run the search
const run = async () => {
  await connectDB();
  await findDuplicateItems();
  await mongoose.disconnect();
  console.log('\n✅ Duplicate search completed and database connection closed.');
};

run().catch(console.error);