import connectDB from './server/config/database.js';
import Order from './server/models/Order.js';
import Customer from './server/models/Customer.js';

async function assignCustomersToOrders() {
  try {
    await connectDB();
    console.log('🔧 Assigning customers to orders for testing...\n');

    // Get all customers
    const customers = await Customer.find({}).select('_id name');
    console.log(`📊 Found ${customers.length} customers`);

    // Get orders that need customer assignment
    const orders = await Order.find({ customer: null }).select('_id orderCode').limit(10);
    console.log(`📦 Found ${orders.length} orders without customers`);

    if (orders.length === 0) {
      console.log('✅ All orders already have customers assigned');
      process.exit(0);
    }

    // Assign random customers to orders
    let updatedCount = 0;
    for (const order of orders) {
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      
      await Order.updateOne(
        { _id: order._id },
        { customer: randomCustomer._id }
      );
      
      console.log(`✅ Assigned "${randomCustomer.name}" to order ${order.orderCode}`);
      updatedCount++;
    }

    console.log(`\n🎉 Successfully assigned customers to ${updatedCount} orders!`);

    // Verify the assignments
    console.log('\n🔍 Verification - Sample orders with customers:');
    const verifyOrders = await Order.find({ customer: { $ne: null } })
      .populate('customer', 'name contactPerson')
      .select('orderCode customer')
      .limit(5);

    verifyOrders.forEach(order => {
      console.log(`   ${order.orderCode} → ${order.customer.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignCustomersToOrders();