import mongoose from 'mongoose';
import Order from './server/models/Order.js';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

const debugOrdersAndCompanies = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Find Akshaya Foods company
    const akshayaCompany = await Company.findOne({ 
      name: { $regex: 'Akshaya', $options: 'i' } 
    });
    console.log('Akshaya Foods Company ID:', akshayaCompany._id.toString());

    // Find all orders
    const orders = await Order.find({})
      .populate('salesPerson', 'username fullName companyId')
      .limit(10);

    console.log('\n📋 Orders and their sales persons:');
    orders.forEach(order => {
      console.log(`Order ${order.orderCode}:`);
      console.log(`  Sales Person: ${order.salesPerson?.username || 'None'} (${order.salesPerson?.fullName || 'N/A'})`);
      console.log(`  Sales Person Company: ${order.salesPerson?.companyId || 'None'}`);
      console.log(`  Same company as Akshaya: ${order.salesPerson?.companyId?.toString() === akshayaCompany._id.toString()}`);
      console.log('');
    });

    // Find sales persons from Akshaya Foods
    const akshayaSalesPersons = await User.find({
      companyId: akshayaCompany._id,
      role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
    });

    console.log('\n👥 Akshaya Foods sales team:');
    akshayaSalesPersons.forEach(user => {
      console.log(`  ${user.username} (${user.fullName || 'N/A'}) - Role: ${user.role}`);
    });

    // Check orders created by Akshaya sales team
    const akshayaSalesPersonIds = akshayaSalesPersons.map(sp => sp._id);
    const akshayaOrders = await Order.find({
      salesPerson: { $in: akshayaSalesPersonIds }
    }).populate('salesPerson', 'username fullName role');

    console.log(`\n📦 Orders from Akshaya sales team: ${akshayaOrders.length}`);
    akshayaOrders.forEach(order => {
      console.log(`  ${order.orderCode} by ${order.salesPerson?.username} (${order.salesPerson?.role})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📤 MongoDB connection closed');
  }
};

debugOrdersAndCompanies();