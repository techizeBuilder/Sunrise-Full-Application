import mongoose from 'mongoose';
import Customer from './server/models/Customer.js';
import User from './server/models/User.js';

async function checkCustomerAssignments() {
  await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp');

  console.log('🔍 Checking customer sales contact assignments...\n');

  // Get sales users
  const sales01 = await User.findOne({ username: 'sales01' });
  const chetan = await User.findOne({ username: 'chetan' });

  console.log('Sales Users:');
  console.log('sales01 ID:', sales01?._id?.toString() || 'NOT FOUND');
  console.log('sales01 username:', sales01?.username || 'NOT FOUND');
  console.log('chetan ID:', chetan?._id?.toString() || 'NOT FOUND');
  console.log('chetan username:', chetan?.username || 'NOT FOUND');
  console.log('');

  // Get all customers with their sales contact
  const customers = await Customer.find({}).select('name salesContact customerCode');

  console.log('All Customers and their Sales Contact:');
  customers.forEach((customer, index) => {
    console.log(`${index + 1}. ${customer.name} (Code: ${customer.customerCode}) - Contact: ${customer.salesContact || 'NONE'}`);
  });

  console.log(`\nTotal customers: ${customers.length}`);
  
  // Check customers assigned to sales01
  const sales01Customers = customers.filter(c => 
    c.salesContact === 'sales01' || c.salesContact === sales01?._id?.toString()
  );
  console.log(`Customers assigned to sales01: ${sales01Customers.length}`);
  
  // Check customers assigned to chetan
  const chetanCustomers = customers.filter(c => 
    c.salesContact === 'chetan' || c.salesContact === chetan?._id?.toString()
  );
  console.log(`Customers assigned to chetan: ${chetanCustomers.length}`);
  
  // Check customers with no assignment
  const unassignedCustomers = customers.filter(c => !c.salesContact);
  console.log(`Customers with no sales contact: ${unassignedCustomers.length}`);

  mongoose.connection.close();
}

checkCustomerAssignments();