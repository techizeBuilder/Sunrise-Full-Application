import User from './server/models/User.js';
import connectDB from './server/config/database.js';

async function checkSuperAdminUsers() {
  try {
    await connectDB();
    
    console.log('🔍 Checking Super Admin users...');
    
    const superAdmins = await User.find({ role: 'Super Admin' }, 'username email role isActive').lean();
    
    console.log(`\n📊 Found ${superAdmins.length} Super Admin users:`);
    superAdmins.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - ${user.isActive ? 'Active' : 'Inactive'}`);
    });

    if (superAdmins.length === 0) {
      console.log('\n❌ No Super Admin users found!');
      console.log('💡 You need to create a Super Admin user or update an existing user to Super Admin role.');
    } else {
      console.log('\n✅ Super Admin users found. You can use any of these to login and access company management.');
      console.log('\n🔐 To test the API:');
      console.log('1. Login with one of these users via POST /api/auth/login');
      console.log('2. Use the received JWT token in Authorization header');
      console.log('3. Access /api/super-admin/companies endpoints');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking Super Admin users:', error);
    process.exit(1);
  }
}

checkSuperAdminUsers();