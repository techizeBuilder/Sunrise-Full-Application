import mongoose from 'mongoose';
import Customer from './server/models/Customer.js';

async function checkCustomers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/inventory_db');
    
    const customers = await Customer.find({})
      .populate('companyId', 'name location')
      .select('name companyId city')
      .lean();
    
    console.log('Total customers:', customers.length);
    console.log('\nCustomer distribution by company:');
    
    const companyCounts = {};
    customers.forEach(c => {
      const companyName = c.companyId ? c.companyId.name : 'No Company';
      if (!companyCounts[companyName]) {
        companyCounts[companyName] = 0;
      }
      companyCounts[companyName]++;
      
      console.log(`- ${c.name} | City: ${c.city} | Company: ${companyName}`);
    });
    
    console.log('\nSummary by company:');
    Object.entries(companyCounts).forEach(([company, count]) => {
      console.log(`${company}: ${count} customers`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCustomers();