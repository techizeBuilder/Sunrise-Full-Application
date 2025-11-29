import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import Order from './server/models/Order.js';
import User from './server/models/User.js';
import Customer from './server/models/Customer.js';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

async function testProductDailySummaryCreation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');

    // Find the specific order
    const orderId = '692ac59a0af12d60809a609c';
    const order = await Order.findById(orderId)
      .populate('products.product', 'name')
      .lean();

    if (!order) {
      console.log('❌ Order not found');
      return;
    }

    console.log('📦 Testing ProductDailySummary creation for order:', order.orderCode);
    console.log('Order details:');
    console.log(`  Status: ${order.status}`);
    console.log(`  Company: ${order.companyId}`);
    console.log(`  Date: ${order.orderDate}`);
    console.log(`  Products: ${order.products?.length || 0}`);

    // Manually create ProductDailySummary entries
    console.log('\n🛠️ Manually creating ProductDailySummary entries...');
    
    for (const productItem of order.products) {
      console.log(`\nProcessing product: ${productItem.product?.name || 'Unknown'}`);
      console.log(`  Product ID: ${productItem.product?._id}`);
      console.log(`  Quantity: ${productItem.quantity}`);
      
      // Check if ProductDailySummary entry already exists
      const existingSummary = await ProductDailySummary.findOne({
        productId: productItem.product._id,
        date: order.orderDate,
        companyId: order.companyId
      });

      if (existingSummary) {
        console.log('  ⚠️ ProductDailySummary already exists, updating...');
        existingSummary.productionFinalBatches += productItem.quantity;
        await existingSummary.save();
        console.log(`  ✅ Updated ProductDailySummary: Added ${productItem.quantity} batches`);
      } else {
        console.log('  🆕 Creating new ProductDailySummary entry...');
        const newSummary = new ProductDailySummary({
          productId: productItem.product._id,
          productName: productItem.product?.name || 'Unknown Product', // ✅ REQUIRED FIELD
          date: order.orderDate,
          companyId: order.companyId,
          productionFinalBatches: productItem.quantity,
          totalRequirements: productItem.quantity,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await newSummary.save();
        console.log(`  ✅ Created new ProductDailySummary: Product ${productItem.product._id}, Batches ${productItem.quantity}`);
      }
    }

    // Verify the entries were created
    console.log('\n🔍 Verifying ProductDailySummary entries:');
    const summaries = await ProductDailySummary.find({})
      .populate('productId', 'name code')
      .lean();
    
    console.log(`Found ${summaries.length} ProductDailySummary entries:`);
    summaries.forEach((summary, index) => {
      console.log(`${index + 1}. Product: ${summary.productId?.name || 'Unknown'}`);
      console.log(`   Batches: ${summary.productionFinalBatches}`);
      console.log(`   Date: ${summary.date}`);
      console.log(`   Company: ${summary.companyId}`);
    });

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testProductDailySummaryCreation();