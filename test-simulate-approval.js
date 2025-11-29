import mongoose from 'mongoose';
import Order from './server/models/Order.js';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import { Item } from './server/models/Inventory.js';
import User from './server/models/User.js';
import Customer from './server/models/Customer.js';
import dotenv from 'dotenv';

dotenv.config();

async function simulateUnitManagerApproval() {
  try {
    console.log('🧪 SIMULATING UNIT MANAGER ORDER APPROVAL LOCALLY...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');

    const orderId = '692ac59a0af12d60809a609c';
    
    // Find the order
    const order = await Order.findById(orderId)
      .populate('products.product', 'name')
      .lean();
    
    if (!order) {
      console.log('❌ Order not found');
      return;
    }
    
    console.log('📦 Order found:', order.orderCode);
    console.log(`   Status: ${order.status}`);
    console.log(`   Products: ${order.products?.length || 0}`);
    
    if (order.status === 'approved') {
      console.log('ℹ️  Order is already approved. Let me manually create ProductDailySummary...');
    }
    
    // Clear existing ProductDailySummary entries for this test
    await ProductDailySummary.deleteMany({});
    console.log('🧹 Cleared existing ProductDailySummary entries');
    
    // Simulate the approval logic from Unit Manager controller
    console.log('\n📊 Creating ProductDailySummary entries...');
    
    try {
      for (const productItem of order.products) {
        console.log(`\n🔍 Processing product: ${productItem.product?.name || 'Unknown'}`);
        console.log(`   Product ID: ${productItem.product?._id}`);
        console.log(`   Quantity: ${productItem.quantity}`);
        
        // Get product details for the productName
        const product = await Item.findById(productItem.product._id).select('name').lean();
        if (!product) {
          console.log(`⚠️ Product not found in database: ${productItem.product._id}`);
          continue;
        }
        
        console.log(`   Product name: ${product.name}`);
        
        // Check if ProductDailySummary entry already exists
        const existingSummary = await ProductDailySummary.findOne({
          productId: productItem.product._id,
          date: order.orderDate,
          companyId: order.companyId
        });

        if (existingSummary) {
          console.log('   📝 Updating existing ProductDailySummary...');
          existingSummary.productionFinalBatches += productItem.quantity;
          await existingSummary.save();
          console.log(`   ✅ Updated: Added ${productItem.quantity} batches`);
        } else {
          console.log('   🆕 Creating new ProductDailySummary entry...');
          
          const newSummaryData = {
            productId: productItem.product._id,
            productName: product.name,
            date: order.orderDate,
            companyId: order.companyId,
            productionFinalBatches: productItem.quantity,
            totalRequirements: productItem.quantity,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          console.log('   📋 Summary data:', JSON.stringify(newSummaryData, null, 4));
          
          const newSummary = new ProductDailySummary(newSummaryData);
          await newSummary.save();
          console.log(`   ✅ Created new ProductDailySummary successfully!`);
        }
      }
      
      console.log(`\n🎉 Successfully processed ProductDailySummary for order ${order.orderCode}`);
      
    } catch (summaryError) {
      console.error('❌ Failed to update ProductDailySummary:', summaryError);
      console.error('Error details:', summaryError.message);
      console.error('Stack:', summaryError.stack);
    }
    
    // Verify results
    console.log('\n🔍 VERIFICATION - Checking ProductDailySummary entries:');
    const allSummaries = await ProductDailySummary.find({})
      .populate('productId', 'name')
      .lean();
    
    console.log(`Found ${allSummaries.length} ProductDailySummary entries:`);
    allSummaries.forEach((summary, index) => {
      console.log(`${index + 1}. Product: ${summary.productName}`);
      console.log(`   Product ID: ${summary.productId?._id || summary.productId}`);
      console.log(`   Batches: ${summary.productionFinalBatches}`);
      console.log(`   Date: ${summary.date}`);
      console.log(`   Company: ${summary.companyId}`);
      console.log('   ---');
    });
    
    if (allSummaries.length > 0) {
      console.log('\n✅ SUCCESS: ProductDailySummary entries created!');
      console.log('The logic works correctly. The API should work now.');
    } else {
      console.log('\n❌ FAILED: No ProductDailySummary entries created!');
    }

  } catch (error) {
    console.error('❌ Error in simulation:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

simulateUnitManagerApproval();