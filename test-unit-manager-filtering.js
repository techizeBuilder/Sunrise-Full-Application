import mongoose from 'mongoose';
import Order from './server/models/Order.js';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

const testUnitManagerFiltering = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Simulate the unit_manager01 user
    const unitManager = await User.findOne({ username: 'unit_manager01' });
    console.log('Unit Manager:', {
      username: unitManager.username,
      companyId: unitManager.companyId
    });

    // Build filter query like in the unit manager controller (FIXED)
    const filterQuery = {};
    
    // Get sales persons from the same company
    const companySalesPersons = await User.find({ 
      companyId: unitManager.companyId,
      role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
    }).select('_id username').lean();
    
    const salesPersonIds = companySalesPersons.map(sp => sp._id);
    console.log('Company sales person IDs:', salesPersonIds.map(id => id.toString()));
    console.log('Company sales person usernames:', companySalesPersons.map(sp => sp.username));
    
    // Filter orders by sales persons from the same company (NO companyId filter on orders!)
    filterQuery.salesPerson = { $in: salesPersonIds };
    
    console.log('Final filter query:', filterQuery);

    // Test the query
    const orders = await Order.find(filterQuery)
      .populate('salesPerson', 'username fullName')
      .populate('products.product', 'name code')
      .lean();

    console.log(`\n📦 Found ${orders.length} orders that match unit manager filter`);
    orders.forEach(order => {
      console.log(`  ${order.orderCode} by ${order.salesPerson?.username}`);
      console.log(`    Products: ${order.products?.map(p => p.product?.name || 'Unknown').join(', ')}`);
    });

    // Check if there are any orders without products populated
    const ordersWithoutProducts = orders.filter(order => !order.products || order.products.length === 0);
    console.log(`\n⚠️  Orders without products: ${ordersWithoutProducts.length}`);

    // Check products that might not be populated
    const productsIssues = orders.filter(order => 
      order.products && order.products.some(p => !p.product)
    );
    console.log(`⚠️  Orders with unpopulated products: ${productsIssues.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📤 MongoDB connection closed');
  }
};

testUnitManagerFiltering();