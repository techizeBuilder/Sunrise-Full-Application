// Migration script to add companyId and update salesContact for existing customers
import mongoose from 'mongoose';
import Customer from './server/models/Customer.js';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

// MongoDB connection string - using the same one from the server config
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function migrateCustomerFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the first company to use as default for existing customers without companyId
    const defaultCompany = await Company.findOne();
    if (!defaultCompany) {
      console.error('No companies found. Please create a company first.');
      process.exit(1);
    }

    console.log(`Using default company: ${defaultCompany.name} (${defaultCompany._id})`);

    // Find customers without companyId
    const customersWithoutCompany = await Customer.find({ 
      $or: [
        { companyId: { $exists: false } },
        { companyId: null }
      ]
    });

    console.log(`Found ${customersWithoutCompany.length} customers without companyId`);

    // Update customers to have the default company
    for (const customer of customersWithoutCompany) {
      await Customer.updateOne(
        { _id: customer._id },
        { $set: { companyId: defaultCompany._id } }
      );
      console.log(`Updated customer ${customer.name} (${customer._id}) with companyId`);
    }

    // Find customers with string salesContact values (old format) and convert them
    const customersWithStringSales = await Customer.find({ 
      salesContact: { $type: 'string', $ne: null } 
    }).lean();

    console.log(`Found ${customersWithStringSales.length} customers with string salesContact`);

    // Try to convert string salesContact to user references
    for (const customer of customersWithStringSales) {
      const salesContactString = customer.salesContact;
      
      // Try to find user by username
      const salesUser = await User.findOne({ username: salesContactString });
      
      if (salesUser) {
        await Customer.updateOne(
          { _id: customer._id },
          { $set: { salesContact: salesUser._id } }
        );
        console.log(`Updated customer ${customer.name} salesContact from "${salesContactString}" to user ${salesUser.username} (${salesUser._id})`);
      } else {
        // If no user found, set to null
        await Customer.updateOne(
          { _id: customer._id },
          { $unset: { salesContact: 1 } }
        );
        console.log(`Customer ${customer.name} had unknown salesContact "${salesContactString}", removed field`);
      }
    }

    // Summary
    const totalCustomers = await Customer.countDocuments();
    const customersWithCompany = await Customer.countDocuments({ companyId: { $exists: true, $ne: null } });
    const customersWithSalesContact = await Customer.countDocuments({ salesContact: { $exists: true, $ne: null } });

    console.log('\n--- Migration Summary ---');
    console.log(`Total customers: ${totalCustomers}`);
    console.log(`Customers with companyId: ${customersWithCompany}`);
    console.log(`Customers with salesContact: ${customersWithSalesContact}`);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateCustomerFields();