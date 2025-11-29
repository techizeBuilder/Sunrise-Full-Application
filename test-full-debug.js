import fetch from 'node-fetch';
import fs from 'fs';

async function getTokenAndTestDebug() {
  try {
    console.log('🔐 Getting fresh token...');
    
    // Login to get fresh token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'unit_head',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed, server might not be running');
      return;
    }

    const loginData = await loginResponse.json();
    
    if (loginData.token) {
      // Save token
      fs.writeFileSync('token.txt', loginData.token);
      console.log('✅ Token saved');
      
      // Now test debug endpoint
      console.log('🔍 Testing debug summary endpoint...');
      
      const debugResponse = await fetch('http://localhost:5000/api/production/debug-summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });

      const debugData = await debugResponse.json();
      
      console.log('\n📊 Debug Summary Results:');
      console.log('Status:', debugResponse.status);
      console.log('Response:', JSON.stringify(debugData, null, 2));
      
      if (debugData.success) {
        console.log('\n📈 Analysis:');
        console.log(`Company ID: ${debugData.data.companyId}`);
        console.log(`Company-specific summaries: ${debugData.data.companySummaries.length}`);
        console.log(`Total summaries in DB: ${debugData.data.allSummaries.length}`);
        console.log(`Production group items: ${debugData.data.productionGroupItems.length}`);
        console.log(`Matching items: ${debugData.data.matches.length}`);
        
        if (debugData.data.companySummaries.length > 0) {
          console.log('\n📋 Company Summary Sample:');
          console.log(debugData.data.companySummaries.slice(0, 3));
        }
        
        if (debugData.data.matches.length > 0) {
          console.log('\n✅ Matching Items:');
          debugData.data.matches.forEach(match => {
            console.log(`  ${match.productName}: qtyPerBatch=${match.qtyPerBatch}`);
          });
        } else {
          console.log('\n❌ No matches found between production items and summaries');
          
          console.log('\n📋 Production Group Items:');
          debugData.data.productionGroupItems.forEach(item => console.log(`  - ${item}`));
          
          console.log('\n📋 Summary Product Names:');
          debugData.data.companySummaries.forEach(s => console.log(`  - ${s.productName}`));
        }
      }
    } else {
      console.log('❌ No token in login response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getTokenAndTestDebug();