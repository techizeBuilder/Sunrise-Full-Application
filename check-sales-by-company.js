import connectDB from './server/config/database.js';
import User from './server/models/User.js';

async function checkSalesPersonsByCompany() {
  try {
    await connectDB();
    console.log('🔍 Checking sales persons by company...\n');

    const company1 = '6914090118cf85f80ad856bb'; // Bangalore
    const company2 = '6914090118cf85f80ad856b9';  // Hyderabad

    // Check all users in each company
    console.log('🏢 Company 1 (Bangalore) - All Users:');
    const company1Users = await User.find({ companyId: company1 })
      .select('username role companyId')
      .lean();
    
    company1Users.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
    });
    
    console.log(`\n🏢 Company 2 (Hyderabad) - All Users:`);
    const company2Users = await User.find({ companyId: company2 })
      .select('username role companyId')
      .lean();
      
    company2Users.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
    });

    // Check specifically for Sales role users
    console.log('\n👥 Sales Role Users by Company:');
    
    const company1Sales = await User.find({ 
      companyId: company1, 
      role: 'Sales' 
    }).select('username role companyId').lean();
    
    const company2Sales = await User.find({ 
      companyId: company2, 
      role: 'Sales' 
    }).select('username role companyId').lean();

    console.log(`\nCompany 1 (Bangalore) Sales: ${company1Sales.length}`);
    company1Sales.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
    });

    console.log(`\nCompany 2 (Hyderabad) Sales: ${company2Sales.length}`);
    company2Sales.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
    });

    // Check for any role variations
    console.log('\n🔍 Checking for role variations...');
    const allRoles = await User.distinct('role');
    console.log('All roles in database:', allRoles);

    // Check if there are sales persons with different case
    const salesVariations = await User.find({ 
      role: { $regex: /sales/i } 
    }).select('username role companyId').lean();

    console.log('\nUsers with "sales" in role (case insensitive):');
    salesVariations.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - Company: ${user.companyId}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSalesPersonsByCompany();