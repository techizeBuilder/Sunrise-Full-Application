import mongoose from 'mongoose';
import ProductionGroup from './server/models/ProductionGroup.js';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugProductMatching() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🏭 Checking Production Groups:');
    const groups = await ProductionGroup.find({ isActive: true })
      .populate('items', 'name _id')
      .lean();
    
    console.log(`Found ${groups.length} active production groups`);
    
    if (groups.length > 0) {
      groups.forEach((group, index) => {
        console.log(`\n${index + 1}. Group: ${group.name}`);
        console.log(`   ID: ${group._id}`);
        console.log(`   Company: ${group.company}`);
        console.log(`   Items count: ${group.items?.length || 0}`);
        
        if (group.items && group.items.length > 0) {
          group.items.slice(0, 3).forEach((item, idx) => {
            console.log(`     ${idx + 1}. ${item.name} (ID: ${item._id})`);
          });
        }
      });
    }
    
    console.log('\n📊 Checking ProductDailySummary:');
    const summaries = await ProductDailySummary.find({})
      .populate('productId', 'name _id')
      .limit(5)
      .lean();
      
    console.log(`Found ${summaries.length} product summaries`);
    
    if (summaries.length > 0) {
      summaries.forEach((summary, index) => {
        console.log(`\n${index + 1}. Product: ${summary.productName}`);
        console.log(`   ProductId: ${summary.productId?._id}`);
        console.log(`   Product Name from Item: ${summary.productId?.name}`);
        console.log(`   Company: ${summary.companyId}`);
      });
    }
    
    // Check if any products match any groups
    console.log('\n🔍 Checking Product Matching:');
    if (groups.length > 0 && summaries.length > 0) {
      const firstGroup = groups[0];
      console.log(`\nChecking group "${firstGroup.name}" items against product summaries:`);
      
      const groupItemIds = firstGroup.items.map(item => item._id.toString());
      const summaryProductIds = summaries.map(s => s.productId?._id?.toString()).filter(id => id);
      
      console.log('Group item IDs:', groupItemIds);
      console.log('Summary product IDs:', summaryProductIds);
      
      const matches = groupItemIds.filter(groupId => summaryProductIds.includes(groupId));
      console.log('Matches found:', matches.length);
      console.log('Matching IDs:', matches);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugProductMatching();