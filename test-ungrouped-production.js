import fetch from 'node-fetch';
import fs from 'fs';

async function testUngroupedItemProduction() {
  try {
    // Try to get a token
    let token;
    try {
      token = fs.readFileSync('token.txt', 'utf8').trim();
      console.log('🔑 Using existing token');
    } catch (e) {
      // Try to login
      console.log('🔐 Attempting to login...');
      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: "haribharvad@gmail.com",
          password: "hariB123"
        })
      });

      if (loginResponse.ok) {
        const loginResult = await loginResponse.json();
        token = loginResult.token;
        fs.writeFileSync('token.txt', token);
        console.log('✅ Login successful');
      } else {
        console.log('❌ Login failed');
        return;
      }
    }

    console.log('\n🏭 Testing Ungrouped Item Production Endpoint...');

    // Test scenarios
    const testCases = [
      {
        description: 'Auto-generate batch number (no batchno provided)',
        data: {
          "itemId": "693928b154dc84040900694b",
          "field": "mouldingTime",
          "value": "2025-12-12T09:02:29.254Z"
        }
      },
      {
        description: 'Provide specific batch number',
        data: {
          "itemId": "693928b154dc84040900694b", 
          "field": "unloadingTime",
          "value": "2025-12-12T10:30:00.000Z",
          "batchno": "BATNO02"
        }
      },
      {
        description: 'Update production loss for batch',
        data: {
          "itemId": "693928b154dc84040900694b",
          "field": "productionLoss", 
          "value": "5",
          "batchno": "BATNO01"
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.description}`);
      console.log('Request data:', JSON.stringify(testCase.data, null, 2));

      const response = await fetch('http://localhost:5000/api/production/ungrouped-items/production', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.data)
      });

      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(result, null, 2));
        
        if (result.data) {
          console.log('\n📦 Key Info:');
          console.log(`   Batch No: ${result.data.batchNo}`);
          console.log(`   Batch Number: ${result.data.batchNumber}`);
          console.log(`   Status: ${result.data.status}`);
          console.log(`   Updated Field: ${result.data.updatedField} = ${result.data.updatedValue}`);
          console.log(`   Qty Achieved: ${result.data.qtyAchieved}`);
        }
      } else {
        const errorResult = await response.json();
        console.log('❌ Error:');
        console.log(JSON.stringify(errorResult, null, 2));
      }
      
      console.log('-'.repeat(60));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUngroupedItemProduction();