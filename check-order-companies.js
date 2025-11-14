import connectDB from './server/config/database.js';
import Order from './server/models/Order.js';
import User from './server/models/User.js';

async function checkOrderCompanies() {
  try {
    await connectDB();
    console.log('🔍 Checking orders and their sales person companies...\n');

    // Get all orders with populated salesPerson
    const orders = await Order.find({})
      .populate('salesPerson', 'username role companyId')
      .select('orderCode salesPerson totalAmount createdAt')
      .sort({ createdAt: -1 });

    console.log(`📊 Total Orders: ${orders.length}\n`);

    // Group orders by company
    const ordersByCompany = {};
    
    orders.forEach(order => {
      if (order.salesPerson && order.salesPerson.companyId) {
        const companyId = order.salesPerson.companyId.toString();
        if (!ordersByCompany[companyId]) {
          ordersByCompany[companyId] = [];
        }
        ordersByCompany[companyId].push(order);
      }
    });

    // Display orders by company
    for (const [companyId, companyOrders] of Object.entries(ordersByCompany)) {
      console.log(`🏢 Company: ${companyId}`);
      console.log(`   Orders: ${companyOrders.length}`);
      
      // Show first few orders from this company
      companyOrders.slice(0, 3).forEach(order => {
        console.log(`   📦 ${order.orderCode} - ${order.salesPerson.username} (${order.salesPerson.role}) - ₹${order.totalAmount}`);
      });
      
      if (companyOrders.length > 3) {
        console.log(`   ... and ${companyOrders.length - 3} more orders`);
      }
      console.log('');
    }

    // Check what company our test users belong to
    const testUsers = await User.find({ 
      username: { $in: ['unit_manager01', 'radhe', 'chetan', 'sales01', 'sales02'] }
    }).select('username role companyId');

    console.log('👥 Test Users Companies:');
    testUsers.forEach(user => {
      const companyOrders = ordersByCompany[user.companyId?.toString()] || [];
      console.log(`   ${user.username} (${user.role}) - Company: ${user.companyId} - Orders in DB: ${companyOrders.length}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrderCompanies();