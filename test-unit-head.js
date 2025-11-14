// Test Unit Head company info endpoint
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testUnitHeadCompanyInfo() {
  console.log('🧪 Testing Unit Head Company Info Functionality');
  console.log('='.repeat(60));
  
  try {
    // Login as Unit Head
    console.log('🔐 Logging in as Unit Head (radhe)...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        username: 'radhe', 
        password: '12345678' 
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.success || !loginData.token) {
      console.error('❌ Login failed:', loginData.message);
      return;
    }

    const token = loginData.token;
    console.log('✅ Logged in as Unit Head:');
    console.log(`   - Username: ${loginData.user.username}`);
    console.log(`   - Role: ${loginData.user.role}`);
    console.log(`   - User ID: ${loginData.user.id}`);

    // Test company info endpoint
    console.log('\n📊 Testing company info endpoint...');
    const companyResponse = await fetch(`${BASE_URL}/api/unit-head/company-info`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const companyData = await companyResponse.json();
    
    if (companyResponse.ok) {
      console.log('✅ Company Info Retrieved:');
      console.log(`   - Company Name: ${companyData.data.companyName}`);
      console.log(`   - Unit Name: ${companyData.data.unitName}`);
      console.log(`   - Location: ${companyData.data.location}`);
      console.log(`   - City: ${companyData.data.city}`);
      console.log(`   - Address: ${companyData.data.address}`);
      console.log(`   - Company ID: ${companyData.data.companyId}`);
    } else {
      console.log('❌ Failed to get company info:');
      console.log(`   - Status: ${companyResponse.status}`);
      console.log(`   - Message: ${companyData.message}`);
    }

    // Test creating a Unit Manager with company pre-population
    console.log('\n🧪 Testing Unit Manager creation...');
    const createManagerResponse = await fetch(`${BASE_URL}/api/unit-head/unit-managers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName: 'Test Manager',
        username: 'testmanager001',
        email: 'testmanager@example.com',
        password: 'password123',
        permissions: {
          modules: []
        }
      })
    });

    const createManagerData = await createManagerResponse.json();
    
    if (createManagerResponse.ok) {
      console.log('✅ Unit Manager Created Successfully:');
      console.log(`   - Username: ${createManagerData.data.username}`);
      console.log(`   - Full Name: ${createManagerData.data.fullName}`);
      console.log(`   - Role: ${createManagerData.data.role}`);
      console.log(`   - Company ID: ${createManagerData.data.companyId}`);
    } else {
      console.log('❌ Failed to create Unit Manager:');
      console.log(`   - Status: ${createManagerResponse.status}`);
      console.log(`   - Message: ${createManagerData.message}`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testUnitHeadCompanyInfo();