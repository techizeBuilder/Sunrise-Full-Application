import connectDB from './server/config/database.js';
import Order from './server/models/Order.js';
import Customer from './server/models/Customer.js';

async function fixCustomerAssignments() {
  try {
    await connectDB();
    console.log('🔧 Fixing customer assignments in orders...\n');

    // Get current valid customers
    const customers = await Customer.find({}).select('_id name');
    console.log(`📊 Found ${customers.length} valid customers`);

    if (customers.length === 0) {
      console.log('❌ No customers found in database');
      process.exit(1);
    }

    // Get all orders that need fixing (either null customer or invalid customer ID)
    const allOrders = await Order.find({}).select('_id orderCode customer salesPerson');
    console.log(`📦 Found ${allOrders.length} orders to check`);

    let fixedCount = 0;
    const validCustomerIds = customers.map(c => c._id.toString());

    for (const order of allOrders) {
      let needsUpdate = false;
      
      // Check if customer is null or points to non-existent customer
      if (!order.customer) {
        needsUpdate = true;
        console.log(`❌ Order ${order.orderCode} has null customer`);
      } else if (!validCustomerIds.includes(order.customer.toString())) {
        needsUpdate = true;
        console.log(`❌ Order ${order.orderCode} has invalid customer ID: ${order.customer}`);
      }

      if (needsUpdate) {
        // Assign random customer from available customers
        const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
        
        await Order.updateOne(
          { _id: order._id },
          { customer: randomCustomer._id }
        );
        
        console.log(`✅ Fixed ${order.orderCode} → assigned ${randomCustomer.name}`);
        fixedCount++;
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} orders with customer assignments!`);

    // Verify the fixes
    console.log('\n🔍 Verification - checking populated customer data:');
    const testOrders = await Order.find({})
      .populate('customer', 'name contactPerson email')
      .populate('salesPerson', 'username')
      .select('orderCode customer salesPerson')
      .limit(5);

    testOrders.forEach(order => {
      console.log(`   ${order.orderCode}:`);
      console.log(`     Customer: ${order.customer?.name || 'STILL NULL'}`);
      console.log(`     Sales Person: ${order.salesPerson?.username || 'null'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixCustomerAssignments();