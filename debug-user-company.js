// Debug script to check user company assignments
import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

async function debugUserCompanyAssignments() {
  try {
    // Connect to MongoDB using the same URI as the main app
    const mongoURI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');
    
    // Check all users and their company assignments
    console.log('\n👥 User Company Assignments:');
    const users = await User.find().select('username role companyId isActive').populate('companyId', 'name unitName');
    
    users.forEach(user => {
      const companyInfo = user.companyId ? `${user.companyId.name} (${user.companyId.unitName})` : 'NO_COMPANY';
      console.log(`- ${user.username} (${user.role}) -> ${companyInfo} [Active: ${user.isActive}]`);
    });
    
    // Check companies
    console.log('\n🏢 Available Companies:');
    const companies = await Company.find().select('name unitName city state');
    companies.forEach(company => {
      console.log(`- ${company.name} (${company.unitName}) - ${company.city}, ${company.state}`);
    });
    
    // Check Unit Heads specifically
    console.log('\n🎯 Unit Head Analysis:');
    const unitHeads = await User.find({ role: 'Unit Head' }).populate('companyId', 'name unitName');
    if (unitHeads.length === 0) {
      console.log('No Unit Heads found');
    } else {
      unitHeads.forEach(user => {
        const hasCompany = user.companyId ? '✅ Has Company' : '❌ No Company';
        const companyName = user.companyId ? user.companyId.name : 'NONE';
        console.log(`- ${user.username}: ${hasCompany} (${companyName})`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await mongoose.disconnect();
  }
}

debugUserCompanyAssignments();