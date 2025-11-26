// Test Super Admin companies dropdown fix
import mongoose from 'mongoose';
import { Company } from './server/models/Company.js';

async function testCompaniesDropdown() {
  try {
    // Connect to MongoDB
    const mongoURI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');
    console.log('\n🏢 Checking all companies in database...');
    
    // Get all companies
    const allCompanies = await Company.find({ isActive: true }).select('name city state unitName');
    
    console.log(`📊 Total active companies found: ${allCompanies.length}`);
    console.log('\n📋 Company List:');
    allCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company.unitName}) - ${company.city}, ${company.state}`);
    });
    
    console.log('\n🎯 Expected for Super Admin:');
    console.log('✅ Super Admin should see ALL companies in Store Location dropdown');
    console.log('✅ Unit Head should see ONLY their assigned company');
    
    console.log('\n📋 Test Instructions:');
    console.log('1. Login as Super Admin (admin user)');
    console.log('2. Go to http://localhost:5000/super-admin/inventory');
    console.log('3. Click "Add New Item"');
    console.log('4. Check Store Location dropdown');
    console.log(`5. Should show all ${allCompanies.length} companies, not just 1`);
    
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await mongoose.disconnect();
  }
}

testCompaniesDropdown();