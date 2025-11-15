import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/sunriseERP');

async function fixUnitHeadCompanyAssignment() {
  try {
    console.log('🔧 Fixing Unit Head Company Assignment...\n');

    // Find the Sunrise Foods company in Bengaluru
    const company = await Company.findOne({ 
      name: { $regex: /sunrise/i },
      city: { $regex: /bengaluru/i } 
    });
    
    if (!company) {
      console.log('❌ Sunrise Foods company in Bengaluru not found!');
      console.log('Looking for any Sunrise Foods company...');
      const anyCompany = await Company.findOne({ name: { $regex: /sunrise/i } });
      if (anyCompany) {
        console.log(`Found: ${anyCompany.name} - ${anyCompany.city}, ${anyCompany.state}`);
        console.log('Company ID:', anyCompany._id.toString());
      }
      return;
    }

    console.log(`✅ Found company: ${company.name} - ${company.city}, ${company.state}`);
    console.log(`Company ID: ${company._id.toString()}\n`);

    // Find all Unit Head users that need company assignment
    const unitHeads = await User.find({ role: 'Unit Head' });
    console.log(`Found ${unitHeads.length} Unit Head(s):`);

    for (const unitHead of unitHeads) {
      console.log(`\n👤 Unit Head: ${unitHead.username}`);
      console.log(`   Current CompanyId: ${unitHead.companyId || 'NOT SET'}`);
      
      if (!unitHead.companyId) {
        console.log('   🔧 Assigning company...');
        unitHead.companyId = company._id;
        await unitHead.save();
        console.log('   ✅ Company assigned successfully!');
      } else {
        console.log('   ✅ Company already assigned');
      }
    }

    // Now fix all Unit Managers to have the same company
    console.log('\n🔧 Fixing Unit Managers company assignment...');
    const unitManagers = await User.find({ role: 'Unit Manager' });
    
    for (const unitManager of unitManagers) {
      console.log(`\n👤 Unit Manager: ${unitManager.username}`);
      console.log(`   Current CompanyId: ${unitManager.companyId || 'NOT SET'}`);
      
      if (!unitManager.companyId) {
        console.log('   🔧 Assigning company...');
        unitManager.companyId = company._id;
        await unitManager.save();
        console.log('   ✅ Company assigned successfully!');
      } else {
        console.log('   ✅ Company already assigned');
      }
    }

    console.log('\n🎉 Company assignment fixed!');
    console.log(`All users are now assigned to: ${company.name} - ${company.city}, ${company.state}`);

  } catch (error) {
    console.error('Fix failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixUnitHeadCompanyAssignment();