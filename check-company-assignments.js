// Check and Fix Unit Head Company Assignments
import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

async function checkUnitHeadCompanyAssignments() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp');
    console.log('✅ Connected to MongoDB');

    // Find all Unit Head users
    const unitHeads = await User.find({ role: 'Unit Head' }).select('username email companyId fullName');
    console.log(`\n📊 Found ${unitHeads.length} Unit Head users:`);
    
    for (const unitHead of unitHeads) {
      console.log(`\n👤 Unit Head: ${unitHead.username} (${unitHead.fullName || 'No name'})`);
      console.log(`   Email: ${unitHead.email}`);
      console.log(`   Company ID: ${unitHead.companyId || 'NOT ASSIGNED ❌'}`);
      
      if (unitHead.companyId) {
        try {
          const company = await Company.findById(unitHead.companyId);
          if (company) {
            console.log(`   Company: ${company.name} (${company.city})`);
            console.log(`   ✅ Valid company assignment`);
          } else {
            console.log(`   ❌ Invalid company ID - company not found`);
          }
        } catch (err) {
          console.log(`   ❌ Error fetching company: ${err.message}`);
        }
      } else {
        console.log(`   ❌ NO COMPANY ASSIGNED - THIS IS THE PROBLEM!`);
        
        // List available companies for assignment
        const companies = await Company.find({}).select('name city');
        console.log(`   📋 Available companies to assign:`);
        companies.forEach((company, index) => {
          console.log(`      ${index + 1}. ${company.name} (${company.city})`);
        });
      }
    }

    // Check if there are customers without companyId
    console.log('\n📋 CHECKING CUSTOMERS...');
    const customersWithoutCompany = await mongoose.connection.db.collection('customers').countDocuments({ companyId: { $exists: false } });
    const customersWithCompany = await mongoose.connection.db.collection('customers').countDocuments({ companyId: { $exists: true } });
    
    console.log(`   Customers with company assignment: ${customersWithCompany}`);
    console.log(`   Customers WITHOUT company assignment: ${customersWithoutCompany}`);
    
    if (customersWithoutCompany > 0) {
      console.log(`   ❌ ${customersWithoutCompany} customers need company assignment`);
    }

    // Summary and fix recommendations
    console.log('\n🔧 FIX RECOMMENDATIONS:');
    console.log('1. Assign companyId to Unit Head users who are missing it');
    console.log('2. Assign companyId to customers that are missing it');
    console.log('3. Restart server after database updates');
    console.log('4. Clear browser cache and re-login');
    
    await mongoose.disconnect();
    console.log('\n✅ Database check complete');

  } catch (error) {
    console.error('❌ Database check failed:', error);
    await mongoose.disconnect();
  }
}

checkUnitHeadCompanyAssignments();