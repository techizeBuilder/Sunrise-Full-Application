// Simple test to debug the specific company update issue
import fetch from 'node-fetch';

const API_BASE = 'https://sunrize.shrawantravels.com/api';
const COMPANY_ID = '6914090118cf85f80ad856ba';

// Try different test data to isolate the issue
const testCases = [
  {
    name: "minimal_update",
    data: { name: "Updated Company Name" }
  },
  {
    name: "city_update", 
    data: { city: "Mumbai" }
  },
  {
    name: "companyType_undefined",
    data: { companyType: undefined }
  },
  {
    name: "companyType_null",
    data: { companyType: null }
  },
  {
    name: "companyType_empty_string", 
    data: { companyType: "" }
  },
  {
    name: "companyType_valid",
    data: { companyType: "Branch" }
  },
  {
    name: "original_data",
    data: {
      "unitName": "Sunrise Foods Pvt Ltd",
      "name": "Sunrise Foods", 
      "companyType": "Branch",
      "mobile": "+91-9876543212",
      "email": "bengaluru@sunrisefoods.com",
      "address": "No. 789, Electronic City Phase 1",
      "locationPin": "560100",
      "city": "Bengaluru",
      "state": "Karnataka",
      "gst": "29AABCS1234N2Z7",
      "isActive": true
    }
  }
];

async function testCompanyUpdates() {
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

    // Test each case
    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log('   Data:', JSON.stringify(testCase.data, null, 2));

      const response = await fetch(`${API_BASE}/super-admin/companies/${COMPANY_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testCase.data)
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
      await new Promise(resolve => setTimeout(resolve, 500));
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

testCompanyUpdates();