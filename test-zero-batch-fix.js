import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import ProductDetailsDailySummary from './server/models/ProductDetailsDailySummary.js';
import ProductionGroup from './server/models/ProductionGroup.js';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

async function testZeroBatchHandling() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Simulate the approved summaries logic with proper zero handling
    const companyId = '6914090118cf85f80ad856bc';
    const summaryDate = new Date('2025-12-12');
    summaryDate.setUTCHours(0, 0, 0, 0);

    console.log('🔍 Testing zero batch value handling...');

    // Get master product data
    const masterProducts = await ProductDailySummary.find({
      companyId: companyId
    })
    .populate('productId', 'name code category subCategory')
    .select('productName qtyPerBatch productId')
    .lean();

    console.log(`📊 Found ${masterProducts.length} master products`);

    // Get daily details for approved products
    const dailyDetails = await ProductDetailsDailySummary.find({
      date: summaryDate,
      companyId: companyId,
      status: 'approved'
    })
    .populate('productId', 'name code category subCategory')
    .lean();

    console.log(`📅 Found ${dailyDetails.length} approved daily details`);

    // Create a map of daily details by productId
    const dailyDetailsMap = new Map();
    dailyDetails.forEach(detail => {
      if (detail.productId && detail.productId._id) {
        dailyDetailsMap.set(detail.productId._id.toString(), detail);
      }
    });

    // Process products and test zero handling logic
    console.log('\n🔧 Testing improved available batches calculation:');
    
    let zeroCount = 0;
    let nonZeroCount = 0;
    
    masterProducts.forEach((masterProduct, index) => {
      if (index >= 10) return; // Limit to first 10 for testing
      
      const productId = masterProduct.productId ? masterProduct.productId._id.toString() : null;
      const dailyDetail = dailyDetailsMap.get(productId);
      
      if (dailyDetail) {
        const summary = {
          ...masterProduct,
          ...dailyDetail,
          qtyPerBatch: masterProduct.qtyPerBatch || dailyDetail.qtyPerBatch || 0
        };

        // Apply the new logic
        let availableBatches = 0;
        if (summary.batchAdjusted && summary.batchAdjusted > 0) {
          availableBatches = summary.batchAdjusted;
        } else if (summary.productionFinalBatches && summary.productionFinalBatches > 0) {
          availableBatches = summary.productionFinalBatches;
        } else if (summary.qtyPerBatch && summary.qtyPerBatch > 0) {
          // If no batches set, default to 1 batch based on qtyPerBatch
          availableBatches = 1;
        }

        console.log(`${index + 1}. ${summary.productName}`);
        console.log(`   BatchAdjusted: ${summary.batchAdjusted || 0}`);
        console.log(`   ProductionFinalBatches: ${summary.productionFinalBatches || 0}`);
        console.log(`   QtyPerBatch: ${summary.qtyPerBatch || 0}`);
        console.log(`   ✨ NEW AvailableBatches: ${availableBatches}`);
        console.log(`   Status: ${summary.status}`);
        
        if (availableBatches === 0) {
          zeroCount++;
        } else {
          nonZeroCount++;
        }
        console.log('');
      }
    });

    console.log('📊 SUMMARY:');
    console.log(`✅ Products with available batches > 0: ${nonZeroCount}`);
    console.log(`❌ Products still showing 0 batches: ${zeroCount}`);
    
    if (zeroCount > 0) {
      console.log('\n💡 Products showing 0 batches likely need:');
      console.log('   1. qtyPerBatch to be set in ProductDailySummary');
      console.log('   2. batchAdjusted or productionFinalBatches to be updated');
      console.log('   3. Proper batch configuration in the system');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testZeroBatchHandling();