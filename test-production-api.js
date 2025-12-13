const mongoose = require('mongoose');

// Connect to MongoDB
async function testProductionAPI() {
  try {
    await mongoose.connect('mongodb://localhost:27017/TechiziTestDB');
    console.log('✅ Connected to MongoDB');
    
    // Import models
    const ProductDailySummary = require('./server/models/ProductDailySummary');
    const ProductDetailsDailySummary = require('./server/models/ProductDetailsDailySummary');
    
    console.log('\n📊 Testing Model Separation:');
    
    // Test ProductDailySummary (master data)
    console.log('\n1. ProductDailySummary (Master Data):');
    const masterData = await ProductDailySummary.find({}).limit(3).lean();
    if (masterData.length > 0) {
      console.log('Sample record:', {
        productId: masterData[0].productId,
        qtyPerBatch: masterData[0].qtyPerBatch,
        hasStatus: 'status' in masterData[0],
        hasBatchAdjusted: 'batchAdjusted' in masterData[0]
      });
    } else {
      console.log('No ProductDailySummary records found');
    }
    
    // Test ProductDetailsDailySummary (daily data)
    console.log('\n2. ProductDetailsDailySummary (Daily Data):');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dailyData = await ProductDetailsDailySummary.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).limit(3).lean();
    
    if (dailyData.length > 0) {
      console.log('Sample record:', {
        productId: dailyData[0].productId,
        date: dailyData[0].date,
        batchAdjusted: dailyData[0].batchAdjusted,
        hasQtyPerBatch: 'qtyPerBatch' in dailyData[0]
      });
    } else {
      console.log('No ProductDetailsDailySummary records found for today');
    }
    
    // Test the relationship simulation
    console.log('\n3. Testing API Query Pattern:');
    if (masterData.length > 0) {
      const testProductId = masterData[0].productId;
      
      // Get master data (qtyPerBatch)
      const itemSummary = await ProductDailySummary.findOne({
        productId: testProductId
      }).lean();
      
      // Get today's daily data (batchAdjusted)
      const todayDetails = await ProductDetailsDailySummary.findOne({
        productId: testProductId,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      }).lean();
      
      console.log('Combined result:', {
        productId: testProductId,
        qtyPerBatch: itemSummary?.qtyPerBatch || 0,
        batchAdjusted: todayDetails?.batchAdjusted || 0,
        masterFound: !!itemSummary,
        dailyFound: !!todayDetails
      });
    }
    
    console.log('\n✅ Production API model separation test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

testProductionAPI();
      
      shiftData.data.forEach((group, index) => {
        console.log(`\n📦 Group ${index + 1}: ${group.name}`);
        console.log(`   Total Items: ${group.items?.length || 0}`);
        console.log(`   Qty/Batch: ${group.totalBatchQuantity}`);
        
        if (group.items && group.items.length > 0) {
          console.log('   Items:');
          group.items.forEach(item => {
            console.log(`     - ${item.name}: qtyPerBatch=${item.qtyPerBatch || 0}`);
          });
        }
      });
    } else {
      console.log('❌ No production groups found or API error');
      console.log('Response:', JSON.stringify(shiftData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔍 Debugging tips:');
    console.log('1. Make sure server is running: npm run dev');
    console.log('2. Check if database is connected');
    console.log('3. Verify production groups exist in database');
    console.log('4. Check if ProductDailySummary collection has data');
  }
}

testProductionShiftAPI();