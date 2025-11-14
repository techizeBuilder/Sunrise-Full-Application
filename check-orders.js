import mongoose from 'mongoose';
import Order from './server/models/Order.js';
import User from './server/models/User.js';

async function checkOrders() {
  await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp');

  console.log('🔍 Checking order salesPerson assignments...\n');

  // Get users
  const sales01 = await User.findOne({ username: 'sales01' });
  const chetan = await User.findOne({ username: 'chetan' });

  console.log('Users:');
  console.log('sales01 ID:', sales01?._id?.toString() || 'NOT FOUND');
  console.log('chetan ID:', chetan?._id?.toString() || 'NOT FOUND');
  console.log('');

  // Get all orders with salesPerson info
  const orders = await Order.find({}).populate('salesPerson', 'username').select('orderCode salesPerson');

  console.log('Orders and their salesPerson:');
  orders.forEach(order => {
    console.log(`Order ${order.orderCode}: salesPerson = ${order.salesPerson?.username || 'NONE'} (${order.salesPerson?._id || 'NO ID'})`);
  });

  console.log(`\nTotal orders: ${orders.length}`);
  console.log(`Orders with salesPerson: ${orders.filter(o => o.salesPerson).length}`);
  console.log(`Orders without salesPerson: ${orders.filter(o => !o.salesPerson).length}`);

  mongoose.connection.close();
}

checkOrders();