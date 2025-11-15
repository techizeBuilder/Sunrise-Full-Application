// Check company and user assignments
import mongoose from 'mongoose';
import Customer from './server/models/Customer.js';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function checkAssignments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check all companies
    const companies = await Company.find();
    console.log('\n📊 Companies in database:');
    companies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company._id})`);
    });

    // Check all sales users
    const salesUsers = await User.find({ role: 'Sales' });
    console.log('\n👨‍💼 Sales users:');
    salesUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (Company: ${user.companyId})`);
    });

    // Check customers by company
    for (const company of companies) {
      const customersInCompany = await Customer.countDocuments({ companyId: company._id });
      console.log(`\n📋 Company: ${company.name}`);
      console.log(`   Total customers: ${customersInCompany}`);
      
      // Check how many are assigned to sales users
      const assignedCustomers = await Customer.countDocuments({
        companyId: company._id,
        salesContact: { $exists: true, $ne: null }
      });
      
      console.log(`   Assigned to sales: ${assignedCustomers}`);
      console.log(`   Unassigned: ${customersInCompany - assignedCustomers}`);
    }

    // Show a few sample customers
    const sampleCustomers = await Customer.find()
      .populate('companyId', 'name')
      .populate('salesContact', 'username')
      .limit(5);

    console.log('\n📝 Sample customers:');
    sampleCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.name}`);
      console.log(`      Company: ${customer.companyId?.name || 'No Company'}`);
      console.log(`      Sales Contact: ${customer.salesContact?.username || 'Unassigned'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAssignments();