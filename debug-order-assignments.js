// Debug script to check order and user assignments
import mongoose from 'mongoose';
import Order from './server/models/Order.js';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function debugOrderAssignments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check the specific order mentioned in the error
    const orderId = '69180cda63b94e9e4fbc725e';
    const specificOrder = await Order.findById(orderId)
      .populate('salesPerson', 'username');

    console.log('\n🔍 Specific Order Analysis:');
    if (specificOrder) {
      console.log('   Order ID:', orderId);
      console.log('   Order Number:', specificOrder.orderCode);
      console.log('   Status:', specificOrder.status);
      console.log('   Company ID:', specificOrder.companyId);
      console.log('   Unit:', specificOrder.unit || 'No Unit');
      console.log('   Sales Person:', specificOrder.salesPerson?.username || 'No Sales Person');
      console.log('   Total Amount:', specificOrder.totalAmount);
      console.log('   Created At:', specificOrder.createdAt);
    } else {
      console.log('   Order not found!');
    }

    // Check all Unit Manager users
    const unitManagers = await User.find({ role: 'Unit Manager' });
    
    console.log('\n👨‍💼 Unit Manager Users:');
    unitManagers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username}`);
      console.log(`      Company ID: ${user.companyId}`);
      console.log(`      Unit: ${user.unit || 'No Unit'}`);
    });

    // Check all orders and their company/unit assignments
    const allOrders = await Order.find()
      .populate('salesPerson', 'username')
      .limit(10);

    console.log('\n📋 Sample Orders:');
    allOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.orderCode || order._id}`);
      console.log(`      Company ID: ${order.companyId}`);
      console.log(`      Unit: ${order.unit || 'No Unit'}`);
      console.log(`      Status: ${order.status}`);
      console.log(`      Sales Person: ${order.salesPerson?.username || 'No Sales Person'}`);
    });

    // Check order counts by company
    const orderCounts = await Order.aggregate([
      {
        $group: {
          _id: '$companyId',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Orders by Company:');
    orderCounts.forEach(item => {
      console.log(`   Company ${item._id}: ${item.count} orders`);
    });

    // Test the exact filter used by Unit Manager
    const testUser = unitManagers[0];
    if (testUser) {
      console.log(`\n🧪 Testing filter for ${testUser.username}:`);
      
      const baseFilter = {
        companyId: testUser.companyId
      };
      
      if (testUser.unit) {
        baseFilter.unit = testUser.unit;
      }
      
      console.log('   Filter:', baseFilter);
      
      const filteredOrders = await Order.find(baseFilter);
      console.log(`   Found ${filteredOrders.length} orders with this filter`);
      
      // Test if the specific order matches this filter
      const specificOrderMatch = await Order.findOne({ _id: orderId, ...baseFilter });
      console.log(`   Specific order matches filter: ${!!specificOrderMatch}`);
    }

  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugOrderAssignments();