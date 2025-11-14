// Debug script to check company assignments and sales persons
import mongoose from 'mongoose';
import User from './server/models/User.js';
import Order from './server/models/Order.js';
import { Company } from './server/models/Company.js';

async function debugCompanyAssignments() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp');
    
    console.log('🔍 DEBUGGING COMPANY ASSIGNMENTS AND ORDERS');
    console.log('='.repeat(60));
    
    // 1. Check unit_manager01 details
    const unitManager = await User.findOne({ username: 'unit_manager01' })
      .populate('companyId')
      .select('username email role companyId');
    
    console.log('\n1. UNIT MANAGER DETAILS:');
    console.log('Username:', unitManager?.username);
    console.log('Role:', unitManager?.role);
    console.log('Company ID:', unitManager?.companyId);
    if (unitManager?.companyId) {
      console.log('Company Details:', {
        id: unitManager.companyId._id,
        name: unitManager.companyId.name,
        location: unitManager.companyId.location,
        city: unitManager.companyId.city
      });
    }
    
    // 2. Check all sales persons
    const salesPersons = await User.find({ 
      role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
    }).populate('companyId').select('username email role companyId');
    
    console.log('\n2. ALL SALES PERSONS:');
    salesPersons.forEach(sp => {
      console.log(`- ${sp.username} (@${sp.email}) - ${sp.role}`);
      console.log(`  Company: ${sp.companyId ? sp.companyId.name + ' (' + sp.companyId.location + ')' : 'NO COMPANY'}`);
    });
    
    // 3. Check sales persons in unit_manager01's company
    if (unitManager?.companyId) {
      const companySalesPersons = await User.find({ 
        companyId: unitManager.companyId._id,
        role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
      }).select('username email role');
      
      console.log('\n3. SALES PERSONS IN SAME COMPANY:');
      companySalesPersons.forEach(sp => {
        console.log(`- ${sp.username} (@${sp.email}) - ${sp.role}`);
      });
      
      // 4. Check orders from these sales persons
      const salesPersonIds = companySalesPersons.map(sp => sp._id);
      const orders = await Order.find({ 
        salesPerson: { $in: salesPersonIds }
      }).populate('salesPerson', 'username email role')
        .populate('customer', 'name')
        .limit(10);
      
      console.log('\n4. ORDERS FROM COMPANY SALES PERSONS:');
      console.log(`Total orders found: ${orders.length}`);
      orders.forEach(order => {
        console.log(`- ${order.orderCode} by ${order.salesPerson?.username || 'Unknown'} for ${order.customer?.name || 'Unknown Customer'}`);
      });
    }
    
    // 5. Check all orders with sales persons
    const allOrders = await Order.find({ salesPerson: { $exists: true, $ne: null } })
      .populate('salesPerson', 'username role companyId')
      .populate('customer', 'name')
      .limit(20);
    
    console.log('\n5. ALL ORDERS WITH SALES PERSONS (Sample):');
    allOrders.forEach(order => {
      console.log(`- ${order.orderCode} by ${order.salesPerson?.username || 'Unknown'} (${order.salesPerson?.role}) for ${order.customer?.name || 'Unknown'}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugCompanyAssignments();