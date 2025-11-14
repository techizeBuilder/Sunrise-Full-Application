// Check orders for company sales persons
import mongoose from 'mongoose';
import User from './server/models/User.js';
import Order from './server/models/Order.js';

async function checkCompanyOrders() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp');
    
    console.log('🔍 CHECKING ORDERS FOR AKSHAYA FOODS COMPANY');
    console.log('='.repeat(60));
    
    // Get Akshaya Foods company ID
    const unitManager = await User.findOne({ username: 'unit_manager01' });
    const companyId = unitManager?.companyId;
    
    console.log('Unit Manager Company ID:', companyId);
    
    // Get all sales persons in same company
    const companySalesPersons = await User.find({ 
      companyId: companyId,
      role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
    }).select('username email role');
    
    console.log('\nSALES PERSONS IN AKSHAYA FOODS:');
    companySalesPersons.forEach(sp => {
      console.log(`- ${sp.username} (@${sp.email}) - ${sp.role} - ID: ${sp._id}`);
    });
    
    // Check orders from these sales persons
    const salesPersonIds = companySalesPersons.map(sp => sp._id);
    console.log('\nSales Person IDs to filter by:', salesPersonIds.map(id => id.toString()));
    
    const orders = await Order.find({ 
      salesPerson: { $in: salesPersonIds }
    }).populate('salesPerson', 'username email role').limit(20);
    
    console.log('\nORDERS FROM AKSHAYA FOODS SALES PERSONS:');
    console.log(`Total orders found: ${orders.length}`);
    
    if (orders.length > 0) {
      orders.forEach(order => {
        console.log(`- ${order.orderCode} by ${order.salesPerson?.username || 'Unknown'} (${order.salesPerson?.role})`);
        console.log(`  Order Date: ${order.orderDate}`);
        console.log(`  Status: ${order.status}`);
        console.log('  ---');
      });
    } else {
      console.log('❌ NO ORDERS FOUND!');
      
      // Let's check all orders to see what sales persons exist
      console.log('\nCHECKING ALL ORDERS IN SYSTEM:');
      const allOrders = await Order.find({ salesPerson: { $exists: true, $ne: null } })
        .populate('salesPerson', 'username role companyId')
        .limit(10);
      
      console.log(`Found ${allOrders.length} orders with sales persons:`);
      allOrders.forEach(order => {
        console.log(`- ${order.orderCode} by ${order.salesPerson?.username} (Company: ${order.salesPerson?.companyId || 'No Company'})`);
      });
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCompanyOrders();