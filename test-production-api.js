import fetch from 'node-fetch';
import fs from 'fs';

async function testProductionShiftAPI() {
  try {
    console.log('🧪 Testing Production Shift API without debug endpoint...');
    
    // First, try to login and get a token
    console.log('🔐 Attempting login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'unit_head',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Server not running or login failed');
      console.log('📝 This means either:');
      console.log('   1. Server is not started');
      console.log('   2. Auth endpoints are not working');
      console.log('   3. Database connection issue');
      return;
    }

    const loginData = await loginResponse.json();
    if (!loginData.token) {
      console.log('❌ No token received');
      return;
    }

    console.log('✅ Login successful');
    fs.writeFileSync('token.txt', loginData.token);

    // Test production shift endpoint
    console.log('📊 Testing production shift endpoint...');
    const shiftResponse = await fetch('http://localhost:5000/api/production/production-shift', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });

    const shiftData = await shiftResponse.json();
    console.log('Response status:', shiftResponse.status);
    
    if (shiftData.success && shiftData.data) {
      console.log(`✅ Found ${shiftData.data.length} production groups`);
      
      shiftData.data.forEach((group, index) => {
        console.log(`\n📦 Group ${index + 1}: ${group.name}`);
        console.log(`   Total Items: ${group.items?.length || 0}`);
        console.log(`   Qty/Batch: ${group.totalBatchQuantity}`);
        
        if (group.items && group.items.length > 0) {
          console.log('   Items:');
          group.items.forEach(item => {
            console.log(`     - ${item.name}: qtyPerBatch=${item.qtyPerBatch || 0}`);
          });
        }
      });
    } else {
      console.log('❌ No production groups found or API error');
      console.log('Response:', JSON.stringify(shiftData, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔍 Debugging tips:');
    console.log('1. Make sure server is running: npm run dev');
    console.log('2. Check if database is connected');
    console.log('3. Verify production groups exist in database');
    console.log('4. Check if ProductDailySummary collection has data');
  }
}

testProductionShiftAPI();