// Debug Unit Manager user data to see missing unit assignment

import mongoose from 'mongoose';
import User from './server/models/User.js';

const debugUnitManagerUser = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/erp_system');
    
    console.log('\n=== DEBUGGING UNIT MANAGER USER DATA ===');
    
    // Find unit managers to see their data structure
    const unitManagers = await User.find({ role: 'Unit Manager' }).limit(5);
    
    console.log(`Found ${unitManagers.length} Unit Manager users:`);
    
    unitManagers.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   CompanyId: ${user.companyId}`);
      console.log(`   Unit: ${user.unit}`);
      console.log(`   Created: ${user.createdAt}`);
      
      if (!user.unit && user.companyId) {
        console.log(`   ❌ ISSUE: User has companyId but missing unit field!`);
      } else if (user.unit && user.companyId) {
        console.log(`   ✅ OK: User has both unit and companyId`);
      } else {
        console.log(`   ⚠️  WARNING: User missing required fields`);
      }
    });
    
    // Check if there's a specific user causing the dashboard error
    console.log('\n=== CHECKING FOR USERS WITH COMPANY BUT NO UNIT ===');
    const problematicUsers = await User.find({ 
      role: 'Unit Manager',
      companyId: { $exists: true, $ne: null },
      $or: [
        { unit: { $exists: false } },
        { unit: null },
        { unit: '' }
      ]
    });
    
    if (problematicUsers.length > 0) {
      console.log(`❌ Found ${problematicUsers.length} Unit Managers with companyId but no unit:`);
      problematicUsers.forEach(user => {
        console.log(`   - ${user.username} (CompanyId: ${user.companyId}, Unit: ${user.unit})`);
      });
      
      // Fix option: assign a default unit
      console.log('\n🔧 FIXING: Assigning default unit to users...');
      for (const user of problematicUsers) {
        user.unit = 'Main Unit'; // Default unit assignment
        await user.save();
        console.log(`   ✅ Fixed ${user.username} - assigned unit: "Main Unit"`);
      }
    } else {
      console.log('✅ No users found with missing unit field');
    }
    
  } catch (error) {
    console.error('❌ Error debugging user data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB connection closed');
  }
};

debugUnitManagerUser();