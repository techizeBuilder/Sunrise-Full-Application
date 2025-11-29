// Verify Sales Person Assignments
import mongoose from 'mongoose';

async function verifySalesPersonAssignments() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp');
    console.log('✅ Connected to MongoDB');

    // Get all customers with their sales person assignments
    const customersWithSalesPerson = await mongoose.connection.db.collection('customers').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'salesContact',
          foreignField: '_id',
          as: 'salesPerson'
        }
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company'
        }
      },
      {
        $addFields: {
          salesPerson: { $arrayElemAt: ['$salesPerson', 0] },
          company: { $arrayElemAt: ['$company', 0] }
        }
      }
    ]).toArray();

    console.log('\n📊 SALES PERSON ASSIGNMENT VERIFICATION:');
    console.log('=========================================');

    // Group by company
    const companiesData = {};
    
    customersWithSalesPerson.forEach(customer => {
      const companyName = customer.company?.name || 'No Company';
      const salesPersonName = customer.salesPerson?.fullName || customer.salesPerson?.username || 'UNASSIGNED';
      
      if (!companiesData[companyName]) {
        companiesData[companyName] = {
          totalCustomers: 0,
          assignedCustomers: 0,
          salesPersons: {}
        };
      }
      
      companiesData[companyName].totalCustomers++;
      
      if (customer.salesContact) {
        companiesData[companyName].assignedCustomers++;
        if (!companiesData[companyName].salesPersons[salesPersonName]) {
          companiesData[companyName].salesPersons[salesPersonName] = [];
        }
        companiesData[companyName].salesPersons[salesPersonName].push(customer.name);
      }
    });

    // Display results
    for (const [companyName, data] of Object.entries(companiesData)) {
      console.log(`\n🏢 ${companyName}:`);
      console.log(`   Total customers: ${data.totalCustomers}`);
      console.log(`   Assigned customers: ${data.assignedCustomers}`);
      console.log(`   Assignment rate: ${((data.assignedCustomers / data.totalCustomers) * 100).toFixed(1)}%`);
      
      if (Object.keys(data.salesPersons).length > 0) {
        console.log(`   📋 Sales person distribution:`);
        for (const [salesPerson, customers] of Object.entries(data.salesPersons)) {
          console.log(`      ${salesPerson}: ${customers.length} customers`);
          customers.forEach(customer => {
            console.log(`         - ${customer}`);
          });
        }
      } else {
        console.log(`   ❌ No sales persons assigned to customers in this company`);
      }
    }

    // Overall statistics
    const totalCustomers = customersWithSalesPerson.length;
    const assignedCustomers = customersWithSalesPerson.filter(c => c.salesContact).length;
    const unassignedCustomers = totalCustomers - assignedCustomers;

    console.log(`\n📈 OVERALL STATISTICS:`);
    console.log(`   Total customers: ${totalCustomers}`);
    console.log(`   Assigned customers: ${assignedCustomers}`);
    console.log(`   Unassigned customers: ${unassignedCustomers}`);
    console.log(`   Overall assignment rate: ${((assignedCustomers / totalCustomers) * 100).toFixed(1)}%`);

    if (unassignedCustomers === 0) {
      console.log(`\n✅ SUCCESS: All customers have been assigned to sales persons!`);
    } else {
      console.log(`\n⚠️  WARNING: ${unassignedCustomers} customers still need sales person assignment`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Verification complete');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    await mongoose.disconnect();
  }
}

console.log('🔍 Verifying sales person assignments...');
verifySalesPersonAssignments();