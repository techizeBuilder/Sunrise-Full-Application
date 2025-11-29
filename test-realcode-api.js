// Quick test to check API response format
async function testAPI() {
  try {
    console.log('🧪 Testing Production Dashboard API...');
    
    const response = await fetch('http://localhost:5000/api/production/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add your actual JWT token here if needed
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:');
      console.log(JSON.stringify(data, null, 2));
      
      // Check for realcode group specifically
      const realcodeGroup = data.data?.find(item => 
        item.productGroup?.toLowerCase().includes('realcode')
      );
      
      if (realcodeGroup) {
        console.log(`\n🎯 Found realcode group: ${realcodeGroup.noOfBatchesForProduction} batches`);
      } else {
        console.log('\n⚠️ realcode group not found');
      }
      
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.log('❌ Test failed - server may not be running');
    console.log('Expected format for realcode group:');
    console.log({
      productGroup: "realcode",
      noOfBatchesForProduction: 482  // 32 + 450 from PIZAA items
    });
  }
}

testAPI();