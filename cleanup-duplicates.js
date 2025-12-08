import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function removeDuplicateItems() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB for duplicate cleanup');

    // Find all duplicate sets
    const duplicateQuery = [
      {
        $group: {
          _id: {
            name: '$name',
            store: '$store'
          },
          count: { $sum: 1 },
          items: { 
            $push: {
              id: '$_id',
              name: '$name',
              code: '$code',
              companyId: '$companyId',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];

    const duplicateSets = await Item.aggregate(duplicateQuery);
    
    console.log(`🔍 Found ${duplicateSets.length} sets of duplicate items to clean up:`);
    
    let totalRemoved = 0;
    
    for (let i = 0; i < duplicateSets.length; i++) {
      const duplicateSet = duplicateSets[i];
      console.log(`\n${i + 1}. Processing duplicate set: "${duplicateSet._id.name}"`);
      console.log(`   Store: ${duplicateSet._id.store}`);
      console.log(`   Count: ${duplicateSet.count} items`);
      
      // Sort items by creation date (keep the first created, remove the rest)
      const sortedItems = duplicateSet.items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      console.log(`   Keeping: ${sortedItems[0].code} (Created: ${new Date(sortedItems[0].createdAt).toLocaleString()})`);
      
      // Remove all items except the first one
      for (let j = 1; j < sortedItems.length; j++) {
        const itemToRemove = sortedItems[j];
        console.log(`   Removing: ${itemToRemove.code} (Created: ${new Date(itemToRemove.createdAt).toLocaleString()})`);
        
        try {
          await Item.findByIdAndDelete(itemToRemove.id);
          totalRemoved++;
          console.log(`   ✅ Removed duplicate item ${itemToRemove.code}`);
        } catch (error) {
          console.log(`   ❌ Failed to remove item ${itemToRemove.code}:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Cleanup complete! Removed ${totalRemoved} duplicate items.`);
    
    // Verify cleanup
    const remainingDuplicates = await Item.aggregate(duplicateQuery);
    console.log(`\n🔍 Verification: ${remainingDuplicates.length} duplicate sets remaining after cleanup`);

  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

removeDuplicateItems();