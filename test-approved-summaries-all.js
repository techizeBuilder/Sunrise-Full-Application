import fetch from 'node-fetch';
import fs from 'fs';

async function testApprovedProductSummaries() {
  try {
    // Try to get a fresh token (if login endpoint works)
    console.log('🔑 Testing approved product summaries endpoint...');

    // First try to login to get a fresh token
    const loginData = {
      username: "haribharvad@gmail.com",
      password: "hariB123"
    };

    console.log('🔐 Attempting to login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    let token;
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      token = loginResult.token;
      console.log('✅ Login successful, got fresh token');
      
      // Save token for future use
      fs.writeFileSync('token.txt', token);
    } else {
      // Try to use existing token
      try {
        token = fs.readFileSync('token.txt', 'utf8').trim();
        console.log('🔑 Using existing token');
      } catch (e) {
        console.log('❌ No token available and login failed');
        return;
      }
    }

    console.log('\n📊 Testing approved product summaries API...');
    
    // Test with different limits to see all data
    const testConfigs = [
      { limit: 10, description: 'Default limit' },
      { limit: 100, description: 'Medium limit' },
      { limit: 1000, description: 'High limit (show all)' }
    ];

    for (const config of testConfigs) {
      console.log(`\n🔍 Testing with ${config.description} (limit=${config.limit}):`);
      
      const response = await fetch(`http://localhost:5000/api/unit-manager/product-summaries/approved?limit=${config.limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`📈 Success: ${data.success}`);
        console.log(`📊 Total products: ${data.data?.stats?.totalApproved || 'N/A'}`);
        console.log(`📋 Current page count: ${data.data?.stats?.currentPageCount || 'N/A'}`);
        console.log(`📅 Date filter: ${data.data?.filterApplied?.date || 'N/A'}`);
        
        if (data.data && data.data.summaries) {
          console.log(`\n📦 Sample products (first 5):`);
          data.data.summaries.slice(0, 5).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.productName}`);
            console.log(`     Groups: ${product.productGroups?.join(', ') || 'None'}`);
            console.log(`     Batch Adjusted: ${product.batchAdjusted}`);
            console.log(`     Production Final Batches: ${product.productionFinalBatches}`);
            console.log(`     Available Batches: ${product.availableBatches}`);
            console.log(`     Status: ${product.status}`);
          });
          
          // Check if any products have production groups
          const productsWithGroups = data.data.summaries.filter(p => p.productGroups && p.productGroups.length > 0);
          console.log(`\n🏭 Products with production groups: ${productsWithGroups.length}`);
          
          if (productsWithGroups.length > 0) {
            console.log('📋 Grouped products:');
            productsWithGroups.forEach((product, index) => {
              console.log(`  ${index + 1}. ${product.productName} - Groups: ${product.productGroups.join(', ')}`);
            });
          }
        }
        
        if (config.limit === 1000) {
          console.log('\n🎯 COMPLETE RESPONSE STRUCTURE:');
          console.log(JSON.stringify(data, null, 2));
        }
        
      } else {
        const errorData = await response.json();
        console.log(`❌ Status: ${response.status}`);
        console.log(`Error: ${errorData.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testApprovedProductSummaries();