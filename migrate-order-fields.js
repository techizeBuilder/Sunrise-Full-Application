// Migration script to add companyId and unit to existing orders
import mongoose from 'mongoose';
import Order from './server/models/Order.js';
import User from './server/models/User.js';
import Customer from './server/models/Customer.js';
import { Company } from './server/models/Company.js';

const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function migrateOrderFields() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the default company to use for orders without clear company assignment
    const defaultCompany = await Company.findOne();
    if (!defaultCompany) {
      console.error('No companies found. Please create a company first.');
      process.exit(1);
    }

    console.log(`Using default company: ${defaultCompany.name} (${defaultCompany._id})`);

    // Find orders without companyId
    const ordersWithoutCompany = await Order.find({ 
      $or: [
        { companyId: { $exists: false } },
        { companyId: null }
      ]
    }).populate('salesPerson', 'companyId unit username');

    console.log(`Found ${ordersWithoutCompany.length} orders without companyId`);

    // Update orders with companyId and unit based on their salesPerson
    for (const order of ordersWithoutCompany) {
      let companyId = defaultCompany._id;
      let unit = null;

      // If order has a salesPerson, use their company and unit
      if (order.salesPerson) {
        if (order.salesPerson.companyId) {
          companyId = order.salesPerson.companyId;
        }
        if (order.salesPerson.unit) {
          unit = order.salesPerson.unit;
        }
        
        console.log(`Order ${order.orderCode}: Using salesPerson ${order.salesPerson.username} company/unit`);
      } else {
        console.log(`Order ${order.orderCode}: No salesPerson, using default company`);
      }

      // Update the order
      await Order.updateOne(
        { _id: order._id },
        { 
          $set: { 
            companyId: companyId,
            unit: unit 
          } 
        }
      );
      
      console.log(`Updated order ${order.orderCode} with companyId: ${companyId}, unit: ${unit || 'null'}`);
    }

    // Summary
    const totalOrders = await Order.countDocuments();
    const ordersWithCompany = await Order.countDocuments({ companyId: { $exists: true, $ne: null } });

    console.log('\n--- Migration Summary ---');
    console.log(`Total orders: ${totalOrders}`);
    console.log(`Orders with companyId: ${ordersWithCompany}`);
    console.log('Migration completed successfully!');

    // Test the specific order mentioned in the issue
    const orderId = '69180cda63b94e9e4fbc725e';
    const specificOrder = await Order.findById(orderId);
    if (specificOrder) {
      console.log(`\n✅ Specific order ${orderId} now has:`);
      console.log(`   CompanyId: ${specificOrder.companyId}`);
      console.log(`   Unit: ${specificOrder.unit || 'null'}`);
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateOrderFields();