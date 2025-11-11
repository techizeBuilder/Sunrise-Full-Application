import mongoose from 'mongoose';

async function checkDatabase() {
  try {
    const mongoURI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas');
    
    // Check orders data with sales information
    const ordersData = await mongoose.connection.db.collection('orders').find({}).limit(5).toArray();
    console.log('\nSample orders data (for understanding sales structure):');
    ordersData.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        _id: order._id,
        orderCode: order.orderCode,
        customer: order.customer,
        salesPerson: order.salesPerson,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items?.length || 0
      });
    });
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

checkDatabase();