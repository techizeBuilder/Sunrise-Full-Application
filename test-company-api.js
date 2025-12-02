// Test Company API with proper authentication
import fetch from 'node-fetch';

const API_BASE = 'https://sunrize.shrawantravels.com/api';
const COMPANY_ID = '6914090118cf85f80ad856ba';

const updateData = {
  "unitName": "Sunrise Foods Pvt Ltd",
  "name": "Sunrise Foods",
  "legalName": "",
  "companyType": "Branch",
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

async function testCompanyAPI() {
  try {
    console.log('🧪 Testing Company API...\n');

    // Step 1: Login to get authentication token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    
    if (!loginData.success || !loginData.token) {
      throw new Error(`Login failed: ${loginData.message}`);
    }

    console.log('✅ Login successful!');
    console.log(`   User: ${loginData.user.username} (${loginData.user.role})`);
    console.log(`   Token: ${loginData.token.substring(0, 20)}...`);

    // Step 2: Test updating company
    console.log('\n2. Testing company update...');
    const updateResponse = await fetch(`${API_BASE}/super-admin/companies/${COMPANY_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify(updateData)
    });

    console.log(`   Response status: ${updateResponse.status}`);
    
    const responseText = await updateResponse.text();
    console.log(`   Raw response: ${responseText}`);

    let updateResult;
    try {
      updateResult = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Failed to parse response as JSON: ${responseText}`);
    }

    if (updateResponse.ok) {
      console.log('✅ Company update successful!');
      console.log('   Result:', updateResult.message);
      console.log('   Company Name:', updateResult.company?.name);
      console.log('   Company City:', updateResult.company?.city);
    } else {
      console.log('❌ Company update failed!');
      console.log('   Error:', updateResult.message);
      console.log('   Details:', updateResult);
      
      // Check for specific error types
      if (updateResponse.status === 401) {
        console.log('   🔐 Authentication issue detected');
      } else if (updateResponse.status === 403) {
        console.log('   🚫 Permission issue detected');
      } else if (updateResponse.status === 400) {
        console.log('   📝 Validation error detected');
      } else if (updateResponse.status === 404) {
        console.log('   🔍 Company not found');
      } else if (updateResponse.status === 500) {
        console.log('   🔥 Server error detected');
      }
    }

    // Step 3: Verify company data
    console.log('\n3. Verifying company data...');
    const getResponse = await fetch(`${API_BASE}/super-admin/companies/${COMPANY_ID}`, {
      headers: {
        'Authorization': `Bearer ${loginData.token}`
      }
    });

    if (getResponse.ok) {
      const companyData = await getResponse.json();
      console.log('✅ Company data retrieved:');
      console.log('   Name:', companyData.company?.name);
      console.log('   Type:', companyData.company?.companyType);
      console.log('   City:', companyData.company?.city);
      console.log('   GST:', companyData.company?.gst);
    } else {
      console.log('❌ Failed to retrieve company data');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCompanyAPI();