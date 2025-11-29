// Clean and Update Customer Sales Person Assignments
import mongoose from 'mongoose';

async function cleanAndUpdateSalesPersons() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp');
    console.log('✅ Connected to MongoDB');

    // Step 1: Clean up empty string values in salesContact
    console.log('\n🧹 Step 1: Cleaning up empty string salesContact values...');
    const cleanupResult = await mongoose.connection.db.collection('customers').updateMany(
      { salesContact: '' },
      { $unset: { salesContact: '' } }
    );
    console.log(`   Fixed ${cleanupResult.modifiedCount} customers with empty string salesContact`);

    // Step 2: Count customers without sales person
    const totalCustomers = await mongoose.connection.db.collection('customers').countDocuments({});
    const withoutSalesPerson = await mongoose.connection.db.collection('customers').countDocuments({
      $or: [
        { salesContact: { $exists: false } },
        { salesContact: null }
      ]
    });
    const withSalesPerson = totalCustomers - withoutSalesPerson;

    console.log('\n📊 Current Status:');
    console.log(`   Total customers: ${totalCustomers}`);
    console.log(`   With sales person: ${withSalesPerson}`);
    console.log(`   Without sales person: ${withoutSalesPerson}`);

    if (withoutSalesPerson === 0) {
      console.log('✅ All customers already have sales persons assigned!');
      await mongoose.disconnect();
      return;
    }

    // Step 3: Get customers without sales person grouped by company
    console.log('\n🔄 Step 3: Getting customers without sales person...');
    const customersWithoutSalesPerson = await mongoose.connection.db.collection('customers').find({
      $or: [
        { salesContact: { $exists: false } },
        { salesContact: null }
      ]
    }).toArray();

    // Group by company
    const customersByCompany = {};
    for (const customer of customersWithoutSalesPerson) {
      const companyId = customer.companyId?.toString() || 'no-company';
      if (!customersByCompany[companyId]) {
        customersByCompany[companyId] = [];
      }
      customersByCompany[companyId].push(customer);
    }

    console.log('\n🏢 Customers grouped by company:');
    for (const [companyId, customers] of Object.entries(customersByCompany)) {
      if (companyId === 'no-company') {
        console.log(`   No Company: ${customers.length} customers`);
      } else {
        // Get company name
        const company = await mongoose.connection.db.collection('companies').findOne(
          { _id: new mongoose.Types.ObjectId(companyId) }
        );
        console.log(`   ${company?.name || 'Unknown Company'}: ${customers.length} customers`);
      }
    }

    // Step 4: Assign sales persons
    let totalUpdated = 0;

    for (const [companyId, customers] of Object.entries(customersByCompany)) {
      if (companyId === 'no-company') {
        console.log('\n⚠️  Skipping customers without company assignment');
        continue;
      }

      // Get company name
      const company = await mongoose.connection.db.collection('companies').findOne(
        { _id: new mongoose.Types.ObjectId(companyId) }
      );

      console.log(`\n🔄 Processing company: ${company?.name || 'Unknown'}`);

      // Find sales persons for this company
      const salesPersons = await mongoose.connection.db.collection('users').find({
        companyId: new mongoose.Types.ObjectId(companyId),
        role: 'Sales',
        isActive: true
      }).toArray();

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
          await mongoose.connection.db.collection('customers').updateOne(
            { _id: customer._id },
            { $set: { salesContact: salesPerson._id } }
          );

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

    // Step 5: Final verification
    const finalWithoutSalesPerson = await mongoose.connection.db.collection('customers').countDocuments({
      $or: [
        { salesContact: { $exists: false } },
        { salesContact: null }
      ]
    });

    console.log(`\n🔍 Final Status:`);
    console.log(`   Customers still without sales person: ${finalWithoutSalesPerson}`);
    console.log(`   Assignment rate: ${((totalCustomers - finalWithoutSalesPerson) / totalCustomers * 100).toFixed(1)}%`);

    if (finalWithoutSalesPerson === 0) {
      console.log('   ✅ All customers now have sales persons assigned!');
    }

    await mongoose.disconnect();
    console.log('\n✅ Database update complete');

  } catch (error) {
    console.error('❌ Database update failed:', error);
    await mongoose.disconnect();
  }
}

console.log('🚀 Starting customer sales person assignment update...');
console.log('=====================================================');

cleanAndUpdateSalesPersons();