// Test Unit Head API filtering after company assignment fix

const BASE_URL = 'http://localhost:3000';

// You'll need to replace this token with actual login token
const TEST_UNIT_HEAD_CREDENTIALS = {
  username: 'jeet001', // or whatever the Unit Head username is
  password: '12345678' // or whatever the password is  
};

async function testUnitHeadFiltering() {
  try {
    console.log('🧪 Testing Unit Head API Filtering...\n');

    // Step 1: Login as Unit Head
    console.log('1. Logging in as Unit Head...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_UNIT_HEAD_CREDENTIALS)
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Step 2: Test the unit managers API
    console.log('\n2. Testing unit managers API...');
    const managersResponse = await fetch(`${BASE_URL}/api/unit-head/unit-managers?search=&status=all&limit=100`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!managersResponse.ok) {
      throw new Error(`API call failed: ${managersResponse.status}`);
    }

    const managersData = await managersResponse.json();
    
    console.log('📊 API Response:');
    console.log(`  Success: ${managersData.success}`);
    console.log(`  Total Unit Managers: ${managersData.data?.users?.length || 0}`);
    
    if (managersData.data?.users?.length > 0) {
      console.log('  Unit Managers found:');
      managersData.data.users.forEach((user, index) => {
        console.log(`    ${index + 1}. ${user.username} (${user.email})`);
        console.log(`       Unit: ${user.unit}`);
        console.log(`       CompanyId: ${user.companyId}`);
      });
    } else {
      console.log('  ✅ No unit managers found - this is correct if they are from different companies!');
    }

    console.log(`\n  Summary Stats:`);
    console.log(`    Total: ${managersData.data?.summary?.totalManagers || 0}`);
    console.log(`    Active: ${managersData.data?.summary?.activeManagers || 0}`);
    console.log(`    Inactive: ${managersData.data?.summary?.inactiveManagers || 0}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running (npm run dev in server folder)');
    console.log('   2. MongoDB is running');
    console.log('   3. Run fix-unit-head-company.js first to assign companies');
    console.log('   4. Update the credentials in this script if needed');
  }
}

testUnitHeadFiltering();