// Check available users and login
import mongoose from 'mongoose';
import User from './server/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');

    console.log('\n👥 Checking available users...');
    const users = await User.find({}, 'username email role').limit(10);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`📋 Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');

  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

checkUsers();