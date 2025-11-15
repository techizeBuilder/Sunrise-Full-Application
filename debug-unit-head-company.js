import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/sunriseERP', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function debugUnitHeadCompany() {
  try {
    console.log('🔍 Debugging Unit Head Company Assignment...\n');

    // Find all Unit Heads
    const unitHeads = await User.find({ role: 'Unit Head' }).select('username email role unit companyId');
    console.log('📋 Unit Heads in database:');
    unitHeads.forEach(uh => {
      console.log(`  - ${uh.username} | Unit: ${uh.unit} | CompanyId: ${uh.companyId || 'NOT SET'}`);
    });

    // Find all Unit Managers  
    const unitManagers = await User.find({ role: 'Unit Manager' }).select('username email role unit companyId');
    console.log('\n📋 Unit Managers in database:');
    unitManagers.forEach(um => {
      console.log(`  - ${um.username} | Unit: ${um.unit} | CompanyId: ${um.companyId || 'NOT SET'}`);
    });

    // Get all companies
    const companies = await Company.find({}).select('_id name city state');
    console.log('\n🏢 Companies in database:');
    companies.forEach(company => {
      console.log(`  - ${company._id} | ${company.name} - ${company.city}, ${company.state}`);
    });

    // Check if current Unit Head has proper company assignment
    const currentUnitHead = unitHeads.find(uh => uh.username === 'jeet001' || uh.username === 'radhe' || uh.username.includes('unit'));
    if (currentUnitHead) {
      console.log(`\n🎯 Current Unit Head: ${currentUnitHead.username}`);
      console.log(`   CompanyId: ${currentUnitHead.companyId || 'NOT SET'}`);
      
      if (currentUnitHead.companyId) {
        const company = await Company.findById(currentUnitHead.companyId);
        if (company) {
          console.log(`   Company: ${company.name} - ${company.city}, ${company.state}`);
        } else {
          console.log('   ❌ CompanyId exists but company not found in database!');
        }
      } else {
        console.log('   ❌ Unit Head has no companyId assigned!');
      }
    }

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    mongoose.disconnect();
  }
}

debugUnitHeadCompany();