// Update Customers to Assign Sales Persons
import mongoose from 'mongoose';
import Customer from './server/models/Customer.js';
import User from './server/models/User.js';

async function updateCustomersWithSalesPersons() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp');
    console.log('✅ Connected to MongoDB');

    // Find customers without sales person assignment
    const customersWithoutSalesPerson = await Customer.find({
      $or: [
        { salesContact: { $exists: false } },
        { salesContact: null },
        { salesContact: { $in: ['', undefined] } }
      ]
    }).populate('companyId', 'name city');

    console.log(`\n📊 Found ${customersWithoutSalesPerson.length} customers without sales person assignment:`);

    if (customersWithoutSalesPerson.length === 0) {
      console.log('✅ All customers already have sales persons assigned!');
      await mongoose.disconnect();
      return;
    }

    // Group customers by company
    const customersByCompany = {};
    customersWithoutSalesPerson.forEach(customer => {
      const companyId = customer.companyId?._id?.toString() || 'no-company';
      if (!customersByCompany[companyId]) {
        customersByCompany[companyId] = [];
      }
      customersByCompany[companyId].push(customer);
    });

    console.log('\n🏢 Customers grouped by company:');
    for (const [companyId, customers] of Object.entries(customersByCompany)) {
      const companyName = customers[0]?.companyId?.name || 'No Company';
      console.log(`   ${companyName}: ${customers.length} customers without sales person`);
    }

    // For each company, find available sales persons and assign them
    let totalUpdated = 0;

    for (const [companyId, customers] of Object.entries(customersByCompany)) {
      if (companyId === 'no-company') {
        console.log('\n⚠️  Skipping customers without company assignment');
        continue;
      }

      console.log(`\n🔄 Processing company: ${customers[0]?.companyId?.name}`);

      // Find sales persons for this company
      const salesPersons = await User.find({
        companyId: companyId,
        role: 'Sales',
        isActive: true
      }).select('_id username fullName email');

      if (salesPersons.length === 0) {
        console.log('   ❌ No active sales persons found for this company');
        continue;
      }

      console.log(`   📋 Found ${salesPersons.length} sales persons:`);
      salesPersons.forEach((sp, index) => {
        console.log(`      ${index + 1}. ${sp.fullName || sp.username} (${sp.email})`);
      });

      // Assign sales persons to customers (round-robin distribution)
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        const salesPerson = salesPersons[i % salesPersons.length]; // Round-robin

        try {
          await Customer.findByIdAndUpdate(customer._id, {
            salesContact: salesPerson._id
          });

          console.log(`   ✅ Assigned ${salesPerson.fullName || salesPerson.username} to customer: ${customer.name}`);
          totalUpdated++;
        } catch (error) {
          console.log(`   ❌ Failed to update customer ${customer.name}: ${error.message}`);
        }
      }
    }

    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total customers updated: ${totalUpdated}`);
    console.log(`   Customers without company: ${customersByCompany['no-company']?.length || 0}`);

    // Verify the updates
    console.log('\n🔍 Verification - checking remaining customers without sales persons...');
    const remainingWithoutSalesPerson = await Customer.countDocuments({
      $or: [
        { salesContact: { $exists: false } },
        { salesContact: null },
        { salesContact: { $in: ['', undefined] } }
      ]
    });

    console.log(`   Customers still without sales person: ${remainingWithoutSalesPerson}`);

    if (remainingWithoutSalesPerson === 0) {
      console.log('   ✅ All customers now have sales persons assigned!');
    }

    await mongoose.disconnect();
    console.log('\n✅ Database update complete');

  } catch (error) {
    console.error('❌ Database update failed:', error);
    await mongoose.disconnect();
  }
}

// Also create a function to show current assignment status
async function showSalesPersonAssignmentStatus() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp');
    
    const totalCustomers = await Customer.countDocuments({});
    const withSalesPerson = await Customer.countDocuments({
      salesContact: { $exists: true, $ne: null, $type: 'objectId' }
    });
    const withoutSalesPerson = totalCustomers - withSalesPerson;

    console.log('\n📊 SALES PERSON ASSIGNMENT STATUS:');
    console.log(`   Total customers: ${totalCustomers}`);
    console.log(`   With sales person: ${withSalesPerson}`);
    console.log(`   Without sales person: ${withoutSalesPerson}`);
    console.log(`   Assignment rate: ${((withSalesPerson / totalCustomers) * 100).toFixed(1)}%`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error checking status:', error);
    await mongoose.disconnect();
  }
}

// Run the functions
console.log('🚀 Starting customer sales person assignment update...');
console.log('=====================================================');

// First show current status
await showSalesPersonAssignmentStatus();

// Then update the records
await updateCustomersWithSalesPersons();

// Finally show updated status
await showSalesPersonAssignmentStatus();