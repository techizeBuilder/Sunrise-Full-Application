// Create unit manager with Akshaya Foods company assignment
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './server/models/User.js';

async function createUnitManagerForAkshaya() {
  try {
    await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp');
    
    console.log('🏗️ CREATING UNIT MANAGER FOR AKSHAYA FOODS');
    console.log('='.repeat(50));
    
    // Check if unit_manager01 user already exists
    let unitManager = await User.findOne({ username: 'unit_manager01' });
    
    if (!unitManager) {
      // Create the unit_manager01 user
      const hashedPassword = await bcrypt.hash('12345678', 12);
      
      unitManager = new User({
        username: 'unit_manager01',
        email: 'manager@hotel.com',
        password: hashedPassword,
        fullName: 'Unit Manager 01',
        role: 'Unit Manager',
        companyId: new mongoose.Types.ObjectId('6914090118cf85f80ad856b9'), // Akshaya Foods
        isActive: true,
        permissions: {
          role: 'unit_manager',
          canAccessAllUnits: false,
          modules: []
        }
      });
      
      await unitManager.save();
      console.log('✅ Created unit_manager01 user');
    } else {
      // Update existing user to ensure company assignment
      unitManager.companyId = new mongoose.Types.ObjectId('6914090118cf85f80ad856b9');
      unitManager.role = 'Unit Manager';
      await unitManager.save();
      console.log('✅ Updated existing unit_manager01 user with company assignment');
    }
    
    console.log('\n📊 UNIT MANAGER DETAILS:');
    console.log('Username:', unitManager.username);
    console.log('Email:', unitManager.email);
    console.log('Role:', unitManager.role);
    console.log('Company ID:', unitManager.companyId);
    console.log('Password:', '12345678');
    
    mongoose.connection.close();
    console.log('\n✅ Unit Manager is ready for testing!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createUnitManagerForAkshaya();