import connectDB from './server/config/database.js';
import Order from './server/models/Order.js';
import User from './server/models/User.js';

async function redistributeOrdersBetweenCompanies() {
  try {
    await connectDB();
    console.log('🔄 Redistributing orders between companies...\n');

    const company1 = '6914090118cf85f80ad856bb'; // Bangalore
    const company2 = '6914090118cf85f80ad856b9';  // Hyderabad

    // Get sales persons from each company
    const company1SalesPersons = await User.find({ 
      companyId: company1, 
      role: 'Sales' 
    }).select('_id username');
    
    const company2SalesPersons = await User.find({ 
      companyId: company2, 
      role: 'Sales' 
    }).select('_id username');

    console.log(`Company 1 (Bangalore) Sales Persons: ${company1SalesPersons.length}`);
    company1SalesPersons.forEach(sp => console.log(`  - ${sp.username}`));
    
    console.log(`\nCompany 2 (Hyderabad) Sales Persons: ${company2SalesPersons.length}`);
    company2SalesPersons.forEach(sp => console.log(`  - ${sp.username}`));

    // Get all orders currently assigned to company 2 sales persons
    const company2SalesIds = company2SalesPersons.map(sp => sp._id);
    const allOrders = await Order.find({ 
      salesPerson: { $in: company2SalesIds } 
    }).select('_id orderCode salesPerson');

    console.log(`\nTotal orders currently in Company 2: ${allOrders.length}`);

    if (company1SalesPersons.length === 0) {
      console.log('❌ No sales persons in Company 1 - cannot redistribute');
      process.exit(1);
    }

    // Move half of the orders to Company 1 sales persons
    const ordersToMove = Math.floor(allOrders.length / 2);
    console.log(`\n🔄 Moving ${ordersToMove} orders to Company 1...`);

    for (let i = 0; i < ordersToMove && i < allOrders.length; i++) {
      const order = allOrders[i];
      const randomCompany1SalesPerson = company1SalesPersons[Math.floor(Math.random() * company1SalesPersons.length)];
      
      await Order.updateOne(
        { _id: order._id },
        { salesPerson: randomCompany1SalesPerson._id }
      );
      
      console.log(`✅ Moved ${order.orderCode} to ${randomCompany1SalesPerson.username}`);
    }

    // Verify the distribution
    console.log('\n📊 Verifying new distribution:');
    
    const company1Orders = await Order.find({ 
      salesPerson: { $in: company1SalesPersons.map(sp => sp._id) } 
    }).countDocuments();
    
    const company2OrdersAfter = await Order.find({ 
      salesPerson: { $in: company2SalesIds } 
    }).countDocuments();

    console.log(`Company 1 (Bangalore) orders: ${company1Orders}`);
    console.log(`Company 2 (Hyderabad) orders: ${company2OrdersAfter}`);

    if (company1Orders > 0 && company2OrdersAfter > 0) {
      console.log('\n🎉 Orders successfully redistributed between companies!');
      console.log('Now each Unit Head should see different orders based on their company.');
    } else {
      console.log('\n❌ Redistribution failed - some companies still have 0 orders');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

redistributeOrdersBetweenCompanies();