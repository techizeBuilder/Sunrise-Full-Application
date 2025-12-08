import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sunrizedb';

async function analyzeSpecificDuplicates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB for duplicate analysis');

    // Look for the specific duplicate mentioned by user
    const duplicateItems = await Item.find({
      name: { $regex: /Everyday PremiumSoft Milk Bread 400g \(RRL\)/i },
      store: '6914090118cf85f80ad856bc' // Sunrise Foods Tirupati
    }).sort({ createdAt: 1 });

    console.log(`\n🔍 Found ${duplicateItems.length} items matching "Everyday PremiumSoft Milk Bread 400g (RRL)" in store 6914090118cf85f80ad856bc:`);
    
    duplicateItems.forEach((item, index) => {
      console.log(`\n${index + 1}. Item Details:`);
      console.log(`   ID: ${item._id}`);
      console.log(`   Name: "${item.name}"`);
      console.log(`   Code: ${item.code}`);
      console.log(`   Store: ${item.store}`);
      console.log(`   CompanyId: ${item.companyId || 'NOT_SET'}`);
      console.log(`   Category: ${item.category}`);
      console.log(`   Type: ${item.type}`);
      console.log(`   Created: ${new Date(item.createdAt).toLocaleString()}`);
      console.log(`   Updated: ${new Date(item.updatedAt).toLocaleString()}`);
    });

    // Check if both duplicates have the same exact name (case sensitive)
    if (duplicateItems.length >= 2) {
      const names = duplicateItems.map(item => item.name);
      const exactMatch = names[0] === names[1];
      console.log(`\n🔍 Exact name match (case sensitive): ${exactMatch}`);
      console.log(`   First item name: "${names[0]}"`);
      console.log(`   Second item name: "${names[1]}"`);
      
      // Check character differences
      if (!exactMatch) {
        console.log(`\n📝 Character analysis:`);
        const name1 = names[0];
        const name2 = names[1];
        for (let i = 0; i < Math.max(name1.length, name2.length); i++) {
          if (name1[i] !== name2[i]) {
            console.log(`   Position ${i}: "${name1[i] || 'MISSING'}" vs "${name2[i] || 'MISSING'}"`);
          }
        }
      }
    }

    // Look for all duplicates in the database
    console.log('\n🔍 Searching for ALL duplicate items in the database...');
    
    const duplicateQuery = [
      {
        $group: {
          _id: {
            name: '$name',
            store: '$store'
          },
          count: { $sum: 1 },
          items: { $push: '$_id' },
          details: { 
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

    const allDuplicates = await Item.aggregate(duplicateQuery);
    
    console.log(`\n📋 Found ${allDuplicates.length} sets of duplicate items:`);
    
    allDuplicates.forEach((duplicate, index) => {
      console.log(`\n${index + 1}. Duplicate Set (${duplicate.count} items):`);
      console.log(`   Name: "${duplicate._id.name}"`);
      console.log(`   Store: ${duplicate._id.store}`);
      console.log(`   Items:`);
      duplicate.details.forEach((detail, itemIndex) => {
        console.log(`     ${itemIndex + 1}. ID: ${detail.id}, Code: ${detail.code}, CompanyId: ${detail.companyId || 'NOT_SET'}, Created: ${new Date(detail.createdAt).toLocaleString()}`);
      });
    });

  } catch (error) {
    console.error('❌ Error analyzing duplicates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

analyzeSpecificDuplicates();