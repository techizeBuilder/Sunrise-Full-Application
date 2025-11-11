import mongoose from 'mongoose';
import Order from './server/models/Order.js';
import User from './server/models/User.js';

async function testSalesQuery() {
  try {
    const mongoURI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas');
    
    // Test the exact query being used in getSuperAdminSales
    console.log('\n=== Testing Sales Query ===');
    
    const query = {}; // Empty query like in the API
    const limit = 20;
    const skip = 0;
    const sort = { createdAt: -1 };
    
    console.log('Query:', JSON.stringify(query));
    
    const orders = await Order.find(query)
      .populate({
        path: 'customer',
        select: 'name contactPerson email mobile city'
      })
      .populate({
        path: 'salesPerson',
        select: 'username fullName email'
      })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`Found ${orders.length} orders`);
    
    if (orders.length > 0) {
      console.log('\nFirst order sample:');
      console.log({
        _id: orders[0]._id,
        orderCode: orders[0].orderCode,
        customer: orders[0].customer,
        salesPerson: orders[0].salesPerson,
        totalAmount: orders[0].totalAmount,
        status: orders[0].status,
        createdAt: orders[0].createdAt
      });
    }
    
    // Get total count
    const totalOrders = await Order.countDocuments(query);
    console.log('Total orders in collection:', totalOrders);
    
    // Test sales people query
    const salesPeople = await User.find({ role: 'Sales' })
      .select('username fullName email')
      .lean();
    
    console.log('Sales people found:', salesPeople.length);
    salesPeople.forEach(person => {
      console.log(`- ${person.fullName || person.username} (${person.email})`);
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testSalesQuery();