import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkItemQtyPerBatch() {
  try {
    console.log('🔍 CHECKING ITEM QtyPerBatch VALUES...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');

    // Check the specific item "sdads"
    console.log('📦 Checking product "sdads" details:');
    const sdadsItem = await Item.findOne({ name: 'sdads' }).lean();
    if (sdadsItem) {
      console.log('✅ Found "sdads" item:');
      console.log(`   ID: ${sdadsItem._id}`);
      console.log(`   Name: ${sdadsItem.name}`);
      console.log(`   qtyPerBatch: ${sdadsItem.qtyPerBatch || 'NOT SET'}`);
      console.log(`   qty: ${sdadsItem.qty || 'NOT SET'}`);
      console.log(`   unit: ${sdadsItem.unit || 'NOT SET'}`);
      console.log(`   price: ${sdadsItem.price || 'NOT SET'}`);
      console.log(`   stock: ${sdadsItem.stock || 'NOT SET'}`);
    } else {
      console.log('❌ "sdads" item not found');
    }

    // Check all items and their qtyPerBatch values
    console.log('\n📋 All items qtyPerBatch status:');
    const allItems = await Item.find({}).select('name qtyPerBatch qty unit').lean();
    
    let itemsWithQtyPerBatch = 0;
    let itemsWithoutQtyPerBatch = 0;
    
    allItems.forEach((item, index) => {
      const hasQtyPerBatch = item.qtyPerBatch && item.qtyPerBatch > 0;
      if (hasQtyPerBatch) {
        itemsWithQtyPerBatch++;
      } else {
        itemsWithoutQtyPerBatch++;
      }
      
      if (index < 10) { // Show first 10 items
        console.log(`${index + 1}. ${item.name}:`);
        console.log(`   qtyPerBatch: ${item.qtyPerBatch || 'BLANK/0'}`);
        console.log(`   qty: ${item.qty || 'BLANK/0'}`);
        console.log(`   unit: ${item.unit || 'BLANK'}`);
      }
    });
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total items: ${allItems.length}`);
    console.log(`Items with qtyPerBatch > 0: ${itemsWithQtyPerBatch}`);
    console.log(`Items without qtyPerBatch: ${itemsWithoutQtyPerBatch}`);

    // Check current ProductDailySummary entries
    console.log('\n📈 Current ProductDailySummary entries:');
    const summaries = await ProductDailySummary.find({})
      .populate('productId', 'name')
      .lean();
    
    if (summaries.length === 0) {
      console.log('❌ No ProductDailySummary entries found');
    } else {
      summaries.forEach((summary, index) => {
        console.log(`${index + 1}. ${summary.productName || 'Unknown'}:`);
        console.log(`   ProductionFinalBatches: ${summary.productionFinalBatches}`);
        console.log(`   QtyPerBatch: ${summary.qtyPerBatch || 'BLANK/0'}`);
        console.log(`   Date: ${summary.date}`);
        console.log('   ---');
      });
    }

    console.log('\n💡 RECOMMENDATION:');
    if (itemsWithoutQtyPerBatch > 0) {
      console.log(`⚠️ ${itemsWithoutQtyPerBatch} items don't have qtyPerBatch set.`);
      console.log('For ProductDailySummary to work correctly, items should have qtyPerBatch values.');
      console.log('The code will now use fallback: qtyPerBatch || qty || 1');
    } else {
      console.log('✅ All items have qtyPerBatch values set correctly.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkItemQtyPerBatch();