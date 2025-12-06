import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sfs_inventory');
    console.log('✅ Connected to database');
    
    // Import User model
    const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
    const User = mongoose.model('User', UserSchema);
    
    const users = await User.find({}).limit(10).lean();
    console.log('\n👥 Available users:');
    users.forEach((user, i) => {
      console.log(`  ${i+1}. Username: ${user.username}, Role: ${user.role}, Company: ${user.companyId}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();