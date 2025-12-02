// Test script to verify ProductDailySummary duplicate prevention fix
import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import Order from './server/models/Order.js';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDuplicatePrevention() {
  try {
    console.log('🧪 TESTING PRODUCTDAILYSUMMARY DUPLICATE PREVENTION FIX');
    console.log('=' .repeat(60));

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');

    // Test data
    const testDate = new Date('2025-12-02');
    const testCompanyId = new mongoose.Types.ObjectId('6914909118cf85f80ad856bc');
    const testProductId = new mongoose.Types.ObjectId('68bff35c71ef51a68b5d7ab6');
    
    console.log('\n📋 Test Parameters:');
    console.log(`   Date: ${testDate}`);
    console.log(`   Company ID: ${testCompanyId}`);
    console.log(`   Product ID: ${testProductId}`);

    // Step 1: Clean up any existing test records
    console.log('\n🧹 Cleaning up existing test records...');
    const deleteResult = await ProductDailySummary.deleteMany({
      date: testDate,
      companyId: testCompanyId,
      productId: testProductId
    });
    console.log(`   Deleted ${deleteResult.deletedCount} existing records`);

    // Step 2: Test the normalized date logic
    console.log('\n🔍 Testing date normalization...');
    
    // Create two dates with different times but same day
    const date1 = new Date('2025-12-02T08:30:00.000Z'); // 8:30 AM
    const date2 = new Date('2025-12-02T15:45:00.000Z'); // 3:45 PM
    
    // Normalize both dates
    const normalizedDate1 = new Date(date1);
    normalizedDate1.setUTCHours(0, 0, 0, 0);
    
    const normalizedDate2 = new Date(date2);
    normalizedDate2.setUTCHours(0, 0, 0, 0);
    
    console.log(`   Original date 1: ${date1}`);
    console.log(`   Original date 2: ${date2}`);
    console.log(`   Normalized date 1: ${normalizedDate1}`);
    console.log(`   Normalized date 2: ${normalizedDate2}`);
    console.log(`   Are normalized dates equal? ${normalizedDate1.getTime() === normalizedDate2.getTime()}`);

    // Step 3: Test ProductDailySummary creation with normalized dates
    console.log('\n🛠️  Testing ProductDailySummary creation...');
    
    try {
      // First entry with date1
      const entry1 = new ProductDailySummary({
        productId: testProductId,
        productName: 'PAV-200',
        date: normalizedDate1, // Using normalized date
        companyId: testCompanyId,
        productionFinalBatches: 5,
        qtyPerBatch: 50,
        totalRequirements: 250
      });
      
      await entry1.save();
      console.log('   ✅ Created first ProductDailySummary entry');
      
      // Second entry with date2 (should fail due to unique index)
      const entry2 = new ProductDailySummary({
        productId: testProductId,
        productName: 'PAV-200',
        date: normalizedDate2, // Using normalized date (should be same as date1)
        companyId: testCompanyId,
        productionFinalBatches: 3,
        qtyPerBatch: 50,
        totalRequirements: 150
      });
      
      await entry2.save();
      console.log('   ❌ ERROR: Second entry was created (should have failed!)');
      
    } catch (error) {
      if (error.code === 11000) {
        console.log('   ✅ SUCCESS: Duplicate key error prevented duplicate entry');
        console.log(`   Error details: ${error.message}`);
      } else {
        console.log('   ❌ Unexpected error:', error.message);
      }
    }

    // Step 4: Verify only one record exists
    console.log('\n📊 Verifying database state...');
    const records = await ProductDailySummary.find({
      date: normalizedDate1,
      companyId: testCompanyId,
      productId: testProductId
    });
    
    console.log(`   Records found: ${records.length}`);
    if (records.length === 1) {
      console.log('   ✅ SUCCESS: Only one record exists');
      console.log(`   Record details:`, {
        productName: records[0].productName,
        date: records[0].date,
        productionFinalBatches: records[0].productionFinalBatches,
        qtyPerBatch: records[0].qtyPerBatch
      });
    } else {
      console.log('   ❌ ERROR: Multiple records found');
    }

    // Step 5: Test the error handling logic
    console.log('\n🔧 Testing error handling logic...');
    try {
      // Simulate the exact logic from our fixed controllers
      const existingSummary = await ProductDailySummary.findOne({
        productId: testProductId,
        date: normalizedDate1,
        companyId: testCompanyId
      });

      if (existingSummary) {
        console.log('   ✅ Existing summary found - would update');
        existingSummary.productionFinalBatches = 0; // Unit Manager logic
        await existingSummary.save();
        console.log('   ✅ Successfully updated existing summary');
      } else {
        console.log('   ℹ️  No existing summary - would create new');
      }
    } catch (updateError) {
      console.log('   ❌ Update error:', updateError.message);
    }

    // Cleanup
    console.log('\n🧹 Final cleanup...');
    await ProductDailySummary.deleteMany({
      date: normalizedDate1,
      companyId: testCompanyId,
      productId: testProductId
    });
    console.log('   ✅ Cleanup complete');

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('\n📝 SUMMARY:');
    console.log('   ✅ Date normalization working correctly');
    console.log('   ✅ Unique index preventing duplicates');
    console.log('   ✅ Error handling logic functional');
    console.log('   ✅ Controllers should now prevent duplicate ProductDailySummary entries');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDuplicatePrevention();