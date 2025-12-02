// Test the original update with a working companyType value
import fetch from 'node-fetch';

const API_BASE = 'https://sunrize.shrawantravels.com/api';
const COMPANY_ID = '6914090118cf85f80ad856ba';

const updateData = {
  "unitName": "Sunrise Foods Pvt Ltd",
  "name": "Sunrise Foods",
  "legalName": "",
  "companyType": "Other", // Changed from "Branch" to "Other" 
  "mobile": "+91-9876543212",
  "email": "bengaluru@sunrisefoods.com",
  "address": "No. 789, Electronic City Phase 1",
  "locationPin": "560100",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pan": "",
  "gst": "29AABCS1234N2Z7",
  "isActive": true
};

async function testWorkingUpdate() {
  try {
    console.log('🧪 Testing original request with working companyType...\n');

    // Login
    console.log('1. Logging in...');
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

    console.log('✅ Login successful!');

    // Test update
    console.log('\n2. Testing company update with "Other" companyType...');
    const updateResponse = await fetch(`${API_BASE}/super-admin/companies/${COMPANY_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify(updateData)
    });

    console.log(`   Response status: ${updateResponse.status}`);
    
    const result = await updateResponse.json();

    if (updateResponse.ok) {
      console.log('✅ Company update successful!');
      console.log('   Message:', result.message);
      console.log('   Updated Company Type:', result.company?.companyType);
      console.log('   Updated Name:', result.company?.name);
      console.log('   Updated City:', result.company?.city);
    } else {
      console.log('❌ Company update failed!');
      console.log('   Error:', result.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWorkingUpdate();