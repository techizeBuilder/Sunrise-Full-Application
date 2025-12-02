// Test different companyType values to find which ones work
import fetch from 'node-fetch';

const API_BASE = 'https://sunrize.shrawantravels.com/api';
const COMPANY_ID = '6914090118cf85f80ad856ba';

const companyTypes = [
  'Private Limited',
  'Public Limited', 
  'LLP',
  'Partnership',
  'Proprietorship', 
  'OPC',
  'Branch',
  'Head Office',
  'Other',
  'Invalid Value' // This should fail
];

async function testCompanyTypes() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error('Login failed');
    }

    const token = loginData.token;
    console.log('✅ Login successful');

    // Test each company type
    for (const companyType of companyTypes) {
      console.log(`\n🧪 Testing companyType: "${companyType}"`);

      const response = await fetch(`${API_BASE}/super-admin/companies/${COMPANY_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ companyType })
      });

      console.log(`   Status: ${response.status}`);
      
      const responseText = await response.text();
      
      try {
        const result = JSON.parse(responseText);
        if (response.ok) {
          console.log('   ✅ SUCCESS:', result.message);
        } else {
          console.log('   ❌ FAILED:', result.message);
          if (result.error) {
            console.log('   💬 Details:', result.error);
          }
        }
      } catch (e) {
        console.log('   ❌ NON-JSON Response:', responseText);
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

testCompanyTypes();