import connectDB from './server/config/database.js';
import Order from './server/models/Order.js';
import Customer from './server/models/Customer.js';
import User from './server/models/User.js';

async function debugCustomerData() {
  try {
    await connectDB();
    console.log('🔍 Debugging customer data in orders...\n');

    // Check raw order data
    const rawOrders = await Order.find({})
      .select('orderCode customer salesPerson')
      .limit(5)
      .lean();

    console.log('📦 Raw Order Data (first 5):');
    rawOrders.forEach(order => {
      console.log(`${order.orderCode}:`);
      console.log(`  customer field: ${order.customer}`);
      console.log(`  salesPerson field: ${order.salesPerson}`);
    });

    // Check if customers exist
    const customerCount = await Customer.countDocuments();
    console.log(`\n👥 Total customers in DB: ${customerCount}`);

    if (customerCount > 0) {
      const firstCustomer = await Customer.findOne({});
      console.log(`First customer: ${firstCustomer.name} (ID: ${firstCustomer._id})`);

      // Force assign first customer to first order for testing
      const firstOrder = await Order.findOne({});
      console.log(`\n🔧 Manually assigning customer to order ${firstOrder.orderCode}...`);
      
      await Order.updateOne(
        { _id: firstOrder._id },
        { customer: firstCustomer._id }
      );

      // Verify the assignment
      const updatedOrder = await Order.findById(firstOrder._id)
        .populate('customer', 'name contactPerson email')
        .select('orderCode customer');

      console.log('Updated order:');
      console.log(`  ${updatedOrder.orderCode} → Customer: ${updatedOrder.customer?.name || 'still null'}`);
    }

    // Now test the company filtering logic
    console.log('\n🔍 Testing company filtering for Unit Head...');
    
    // Get Unit Head user
    const unitHead = await User.findOne({ username: 'radhe' });
    console.log(`Unit Head company: ${unitHead.companyId}`);

    // Get sales persons from same company
    const companySalesPersons = await User.find({ 
      companyId: unitHead.companyId,
      role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
    }).select('_id username role').lean();

    console.log(`Sales persons in same company: ${companySalesPersons.length}`);
    companySalesPersons.forEach(sp => {
      console.log(`  - ${sp.username} (${sp.role}) - ID: ${sp._id}`);
    });

    const salesPersonIds = companySalesPersons.map(sp => sp._id);

    // Check orders with this company filter
    const filteredOrders = await Order.find({ 
      salesPerson: { $in: salesPersonIds } 
    })
      .populate('customer', 'name contactPerson email')
      .populate('salesPerson', 'username fullName role')
      .select('orderCode customer salesPerson')
      .limit(3);

    console.log('\n📋 Filtered orders with populated data:');
    filteredOrders.forEach(order => {
      console.log(`${order.orderCode}:`);
      console.log(`  Customer: ${order.customer?.name || 'null'}`);
      console.log(`  Sales Person: ${order.salesPerson?.username || 'null'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugCustomerData();