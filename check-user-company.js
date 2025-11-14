// Check user company assignment for unit_manager01

import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

const checkUserCompany = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/erp_system');
    
    console.log('\n=== CHECKING UNIT MANAGER COMPANY ASSIGNMENT ===');
    
    // Find the unit manager user
    const user = await User.findOne({ username: 'unit_manager01' }).populate('companyId');
    
    if (!user) {
      console.log('❌ User unit_manager01 not found');
      process.exit(1);
    }
    
    console.log('✅ User found:', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });
    
    if (!user.companyId) {
      console.log('❌ User has NO company assigned (companyId is null/undefined)');
      
      // Let's check available companies
      console.log('\n🏢 Available companies:');
      const companies = await Company.find({}).select('name unitName city state');
      companies.forEach(company => {
        console.log(`  ${company._id} - ${company.name} (${company.unitName}) - ${company.city}, ${company.state}`);
      });
      
      // Assign the user to a company (assuming Sunrize Bakery)
      const sunrizeCompany = companies.find(c => c.name === 'Sunrize Bakery');
      if (sunrizeCompany) {
        console.log('\n🔧 Assigning user to Sunrize Bakery company...');
        user.companyId = sunrizeCompany._id;
        await user.save();
        console.log('✅ User assigned to company:', sunrizeCompany.name);
      } else {
        console.log('❌ Sunrize Bakery company not found');
      }
      
    } else {
      console.log('✅ User has company assigned:', {
        id: user.companyId._id,
        name: user.companyId.name,
        unitName: user.companyId.unitName,
        location: `${user.companyId.city}, ${user.companyId.state}`
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
};

checkUserCompany();