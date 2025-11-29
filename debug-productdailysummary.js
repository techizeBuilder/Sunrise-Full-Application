import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import Order from './server/models/Order.js';
import User from './server/models/User.js';
import Customer from './server/models/Customer.js';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkProductDailySummary() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');

    // Check all ProductDailySummary entries
    console.log('\n📊 CHECKING PRODUCTDAILYSUMMARY TABLE:');
    console.log('='.repeat(60));
    
    const allSummaries = await ProductDailySummary.find({})
      .populate('productId', 'name code')
      .sort({ date: -1 })
      .lean();
    
    console.log(`Total ProductDailySummary entries: ${allSummaries.length}`);
    
    if (allSummaries.length === 0) {
      console.log('❌ NO ProductDailySummary entries found in database!');
    } else {
      console.log('\n📋 ProductDailySummary entries:');
      allSummaries.forEach((summary, index) => {
        console.log(`${index + 1}. Product: ${summary.productId?.name || 'Unknown'} (${summary.productId?._id})`);
        console.log(`   Date: ${summary.date}`);
        console.log(`   CompanyId: ${summary.companyId}`);
        console.log(`   ProductionFinalBatches: ${summary.productionFinalBatches}`);
        console.log(`   TotalRequirements: ${summary.totalRequirements}`);
        console.log(`   Created: ${summary.createdAt}`);
        console.log('   ---');
      });
    }

    // Check recent orders
    console.log('\n📦 CHECKING RECENT ORDERS:');
    console.log('='.repeat(60));
    
    const recentOrders = await Order.find({})
      .populate('salesPerson', 'username role')
      .populate('customer', 'name')
      .populate('products.product', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();
    
    console.log(`Found ${recentOrders.length} recent orders:`);
    recentOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order: ${order.orderCode}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Customer: ${order.customer?.name || 'Unknown'}`);
      console.log(`   Sales Person: ${order.salesPerson?.username || 'Unknown'}`);
      console.log(`   Products: ${order.products?.length || 0}`);
      if (order.products) {
        order.products.forEach(p => {
          console.log(`     - ${p.product?.name || 'Unknown'}: ${p.quantity} qty`);
        });
      }
      console.log(`   Order Date: ${order.orderDate}`);
      console.log(`   Updated: ${order.updatedAt}`);
      console.log(`   Company: ${order.companyId}`);
      console.log('   ---');
    });

    // Check specific order ID if it exists
    const testOrderId = '692ac59a0af12d60809a609c';
    console.log(`\n🔍 CHECKING SPECIFIC ORDER: ${testOrderId}`);
    console.log('='.repeat(60));
    
    const specificOrder = await Order.findById(testOrderId)
      .populate('salesPerson', 'username role')
      .populate('customer', 'name')
      .populate('products.product', 'name')
      .lean();
    
    if (specificOrder) {
      console.log('✅ Order found:');
      console.log(`   Order Code: ${specificOrder.orderCode}`);
      console.log(`   Status: ${specificOrder.status}`);
      console.log(`   Customer: ${specificOrder.customer?.name || 'Unknown'}`);
      console.log(`   Sales Person: ${specificOrder.salesPerson?.username || 'Unknown'} (${specificOrder.salesPerson?.role})`);
      console.log(`   Company ID: ${specificOrder.companyId}`);
      console.log(`   Order Date: ${specificOrder.orderDate}`);
      console.log(`   Products (${specificOrder.products?.length || 0}):`);
      if (specificOrder.products) {
        specificOrder.products.forEach(p => {
          console.log(`     - Product ID: ${p.product?._id}`);
          console.log(`       Name: ${p.product?.name || 'Unknown'}`);
          console.log(`       Quantity: ${p.quantity}`);
        });
      }
      
      // Check if ProductDailySummary exists for this order's products
      console.log('\n🔍 Checking ProductDailySummary for this order:');
      if (specificOrder.products) {
        for (const productItem of specificOrder.products) {
          const summary = await ProductDailySummary.findOne({
            productId: productItem.product._id,
            date: specificOrder.orderDate,
            companyId: specificOrder.companyId
          });
          
          if (summary) {
            console.log(`✅ ProductDailySummary found for ${productItem.product.name}:`);
            console.log(`   Batches: ${summary.productionFinalBatches}`);
          } else {
            console.log(`❌ NO ProductDailySummary found for ${productItem.product.name}`);
          }
        }
      }
    } else {
      console.log('❌ Order not found with ID:', testOrderId);
    }

    // Check approved orders
    console.log('\n✅ CHECKING APPROVED ORDERS:');
    console.log('='.repeat(60));
    
    const approvedOrders = await Order.find({ status: 'approved' })
      .populate('products.product', 'name')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();
    
    console.log(`Found ${approvedOrders.length} approved orders:`);
    approvedOrders.forEach((order, index) => {
      console.log(`${index + 1}. Order: ${order.orderCode} (Status: ${order.status})`);
      console.log(`   Company: ${order.companyId}`);
      console.log(`   Date: ${order.orderDate}`);
      console.log(`   Products: ${order.products?.length || 0}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkProductDailySummary();