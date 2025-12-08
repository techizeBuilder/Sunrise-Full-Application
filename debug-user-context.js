import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import User from './server/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function analyzeUserContext() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB for user context analysis');

    // Get all users to see their companyId settings
    const users = await User.find({}).select('username email role companyId');
    console.log('\n👥 All users in the system:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - Role: ${user.role}, CompanyId: ${user.companyId || 'NOT_SET'}`);
    });

    // Check specific items that are duplicates to understand how they might have been created
    const duplicateItem1 = await Item.findById('69363c2982ee42e35fe3b855');
    const duplicateItem2 = await Item.findById('6936478382ee42e35fe3c210');
    
    console.log('\n🔍 Duplicate Item Analysis:');
    console.log('First duplicate item:');
    console.log(`  Created: ${duplicateItem1.createdAt}`);
    console.log(`  Store: ${duplicateItem1.store}`);
    console.log(`  CompanyId: ${duplicateItem1.companyId || 'NOT_SET'}`);
    
    console.log('Second duplicate item:');
    console.log(`  Created: ${duplicateItem2.createdAt}`);
    console.log(`  Store: ${duplicateItem2.store}`);
    console.log(`  CompanyId: ${duplicateItem2.companyId || 'NOT_SET'}`);

    // Calculate time difference
    const timeDiff = Math.abs(duplicateItem2.createdAt - duplicateItem1.createdAt);
    console.log(`\n⏰ Time difference between duplicates: ${Math.round(timeDiff / (1000 * 60))} minutes`);

    // Check if there are any super admin users
    const superAdmins = await User.find({ role: 'super admin' }).select('username companyId');
    console.log('\n👑 Super Admin users:');
    superAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.username} - CompanyId: ${admin.companyId || 'NOT_SET'}`);
    });

  } catch (error) {
    console.error('❌ Error analyzing user context:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

analyzeUserContext();