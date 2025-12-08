import mongoose from 'mongoose';
import { Item } from './server/models/Item.js';
import { Company } from './server/models/Company.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/inventory_management_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const checkDuplicateItems = async () => {
  try {
    console.log('🔍 Checking for duplicate items...\n');

    // Find duplicates based on: name + category + type + location (same as our validation logic)
    const duplicates = await Item.aggregate([
      {
        $group: {
          _id: {
            name: { $toLower: "$name" }, // Case insensitive grouping
            category: "$category",
            type: "$type",
            // Group by both companyId and store fields to handle different storage patterns
            location: {
              $cond: {
                if: { $ne: ["$companyId", null] },
                then: "$companyId",
                else: "$store"
              }
            }
          },
          items: {
            $push: {
              id: "$_id",
              name: "$name",
              code: "$code",
              category: "$category",
              type: "$type",
              companyId: "$companyId",
              store: "$store",
              createdAt: "$createdAt"
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
      console.log('🎉 No duplicate items found! All items are unique within their locations.');
      return;
    }

    console.log(`🚨 Found ${duplicates.length} duplicate item group(s):\n`);

    // Get company names for better display
    const companies = await Company.find({}).select('_id name');
    const companyMap = {};
    companies.forEach(company => {
      companyMap[company._id.toString()] = company.name;
    });

    duplicates.forEach((duplicate, index) => {
      const { name, category, type, location } = duplicate._id;
      const items = duplicate.items;
      const locationName = companyMap[location] || location || 'Unknown Location';

      console.log(`📦 Duplicate Group ${index + 1}:`);
      console.log(`   Name: "${name}" (case insensitive)`);
      console.log(`   Category: ${category}`);
      console.log(`   Type: ${type}`);
      console.log(`   Location: ${locationName} (ID: ${location})`);
      console.log(`   Count: ${items.length} items\n`);

      console.log(`   📋 Duplicate Items Details:`);
      items.forEach((item, itemIndex) => {
        console.log(`   ${itemIndex + 1}. Item ID: ${item.id}`);
        console.log(`      Name: "${item.name}" (exact case)`);
        console.log(`      Code: ${item.code}`);
        console.log(`      Company ID: ${item.companyId || 'null'}`);
        console.log(`      Store: ${item.store || 'null'}`);
        console.log(`      Created: ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}`);
        console.log('');
      });

      console.log(`   🛠️  Suggested Actions:`);
      console.log(`   - Keep the first item (oldest/most established)`);
      console.log(`   - Review and merge data from duplicates`);
      console.log(`   - Delete duplicate items with IDs: ${items.slice(1).map(i => i.id).join(', ')}`);
      console.log(`   - Or rename duplicates to make them distinct\n`);
      console.log('─'.repeat(80) + '\n');
    });

    // Summary statistics
    console.log('📊 DUPLICATE SUMMARY:');
    console.log(`   Total duplicate groups: ${duplicates.length}`);
    console.log(`   Total duplicate items: ${duplicates.reduce((sum, dup) => sum + dup.count, 0)}`);
    console.log(`   Items that should be removed: ${duplicates.reduce((sum, dup) => sum + (dup.count - 1), 0)}`);
    
    // Generate removal script
    console.log('\n🔧 AUTOMATIC CLEANUP SCRIPT:');
    console.log('// Copy this code to remove duplicate items (keeps the first item in each group):');
    console.log('');
    
    const itemsToDelete = [];
    duplicates.forEach(duplicate => {
      // Keep first item, delete the rest
      const toDelete = duplicate.items.slice(1);
      itemsToDelete.push(...toDelete.map(item => item.id));
    });
    
    console.log(`const itemIdsToDelete = [${itemsToDelete.map(id => `"${id}"`).join(', ')}];`);
    console.log('');
    console.log('// Run this in MongoDB to delete duplicates:');
    console.log(`db.items.deleteMany({ _id: { $in: [${itemsToDelete.map(id => `ObjectId("${id}")`).join(', ')}] } });`);

  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
  }
};

// Run the check
const run = async () => {
  await connectDB();
  await checkDuplicateItems();
  await mongoose.disconnect();
  console.log('\n✅ Database connection closed.');
};

run().catch(console.error);