import mongoose from 'mongoose';
import Customer from './server/models/Customer.js';

async function assignCustomersToTestUsers() {
  await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp');

  console.log('🔄 Assigning customers to test sales users...\n');

  // Assign some customers to sales01
  const sales01Customers = await Customer.find({ salesContact: 'sales1' });
  console.log(`Found ${sales01Customers.length} customers assigned to 'sales1', reassigning to 'sales01'`);
  
  for (const customer of sales01Customers) {
    customer.salesContact = 'sales01';
    await customer.save();
    console.log(`✅ Assigned ${customer.name} to sales01`);
  }

  // Assign some customers to chetan
  const chetanCustomers = await Customer.find({ salesContact: 'sales2' });
  console.log(`\nFound ${chetanCustomers.length} customers assigned to 'sales2', reassigning to 'chetan'`);
  
  for (const customer of chetanCustomers) {
    customer.salesContact = 'chetan';
    await customer.save();
    console.log(`✅ Assigned ${customer.name} to chetan`);
  }

  console.log('\n📊 Updated customer assignments:');
  
  // Check final assignments
  const sales01Final = await Customer.find({ salesContact: 'sales01' });
  const chetanFinal = await Customer.find({ salesContact: 'chetan' });
  
  console.log(`sales01 customers: ${sales01Final.length}`);
  sales01Final.forEach(c => console.log(`  - ${c.name}`));
  
  console.log(`\nchetan customers: ${chetanFinal.length}`);
  chetanFinal.forEach(c => console.log(`  - ${c.name}`));

  mongoose.connection.close();
}

assignCustomersToTestUsers();