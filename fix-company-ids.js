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

const fixCompanyIds = async () => {
  try {
    console.log('🔧 Fixing companyId fields from store values...\n');

    // Find items where companyId is null/undefined but store has a value
    const itemsToFix = await Item.find({
      $and: [
        { $or: [{ companyId: null }, { companyId: { $exists: false } }] },
        { store: { $exists: true, $ne: null } }
      ]
    });

    console.log(`Found ${itemsToFix.length} items with missing companyId but valid store field:`);

    if (itemsToFix.length === 0) {
      console.log('🎉 All items already have proper companyId fields!');
      return;
    }

    let fixedCount = 0;

    for (const item of itemsToFix) {
      console.log(`Fixing item: "${item.name}" (${item.code})`);
      console.log(`  Store: ${item.store} -> CompanyId: ${item.store}`);
      
      try {
        await Item.updateOne(
          { _id: item._id },
          { $set: { companyId: item.store } }
        );
        fixedCount++;
      } catch (error) {
        console.error(`  ❌ Failed to update item ${item.code}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully updated ${fixedCount} items!`);

    // Verify the fix
    console.log('\n🔍 Verification - checking for remaining issues...');
    const stillBroken = await Item.find({
      $and: [
        { $or: [{ companyId: null }, { companyId: { $exists: false } }] },
        { store: { $exists: true, $ne: null } }
      ]
    });

    if (stillBroken.length === 0) {
      console.log('✅ All items now have proper companyId fields!');
    } else {
      console.log(`⚠️  Still ${stillBroken.length} items with issues`);
    }

    // Now check for duplicates again
    console.log('\n🔍 Checking for duplicates after companyId fix...');
    const duplicates = await Item.aggregate([
      {
        $group: {
          _id: {
            name: { $toLower: "$name" },
            category: "$category",
            type: "$type",
            companyId: "$companyId"
          },
          items: {
            $push: {
              id: "$_id",
              name: "$name",
              code: "$code",
              companyId: "$companyId",
              store: "$store"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicates.length > 0) {
      console.log(`\n🚨 Found ${duplicates.length} duplicate groups after fix:`);
      duplicates.forEach((dup, index) => {
        console.log(`${index + 1}. "${dup._id.name}" (${dup._id.category}, ${dup._id.type}) - CompanyId: ${dup._id.companyId}`);
        console.log(`   Count: ${dup.count} duplicates`);
        dup.items.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.code} - CompanyId: ${item.companyId} - Store: ${item.store}`);
        });
        console.log('');
      });
    } else {
      console.log('🎉 No duplicates found after companyId fix!');
    }

  } catch (error) {
    console.error('❌ Error fixing companyId fields:', error);
  }
};

// Run the fix
const run = async () => {
  await connectDB();
  await fixCompanyIds();
  await mongoose.disconnect();
  console.log('\n✅ Fix completed and database connection closed.');
};

run().catch(console.error);