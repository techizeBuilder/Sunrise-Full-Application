// Fix Unit Manager missing unit field
import mongoose from 'mongoose';
import User from './server/models/User.js';

const fixUnitManagerUnit = async () => {
  try {
    console.log('🔧 Fixing Unit Manager unit field assignment...');
    await mongoose.connect('mongodb://localhost:27017/erp_system');
    
    // Find the specific user riyan01 
    const user = await User.findOne({ username: 'riyan01' });
    
    if (!user) {
      console.log('❌ User riyan01 not found');
      return;
    }
    
    console.log('📊 Current user data:');
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   CompanyId: ${user.companyId}`);
    console.log(`   Unit: ${user.unit}`);
    
    if (!user.unit && user.companyId) {
      console.log('🔧 Fixing: User has companyId but missing unit field');
      
      // Assign a default unit based on the company
      user.unit = 'Main Unit'; // Default unit name
      await user.save();
      
      console.log('✅ Fixed! Unit assigned:', user.unit);
      
      // Verify the fix by getting updated user data
      const updatedUser = await User.findOne({ username: 'riyan01' });
      console.log('\n📊 Updated user data:');
      console.log(`   Unit: ${updatedUser.unit}`);
      console.log(`   CompanyId: ${updatedUser.companyId}`);
      
      console.log('\n🎉 Unit Manager riyan01 should now be able to access dashboard!');
    } else if (user.unit && user.companyId) {
      console.log('✅ User already has both unit and companyId assigned');
    } else {
      console.log('⚠️  User is missing other required fields');
    }
    
  } catch (error) {
    console.error('❌ Error fixing unit field:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
  }
};

fixUnitManagerUnit();