import fetch from 'node-fetch';

const testProductSummaryAPI = async () => {
  try {
    // Use existing token from file
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTIzZGQ3MjA4ZmNhZDYzZjNjMDM4NzUiLCJpYXQiOjE3NjQzMDI3MTksImV4cCI6MTc2NDM4OTExOX0.O7d9bj2qetfow2DD1KTPLRxLNMz7NX-ZpCNWe4GEFug';
    
    console.log('🔑 Using saved token...');

    // Test the specific API call from your request
    console.log('\n📊 Testing product summary API for 2025-12-06...');
    const response = await fetch('http://localhost:5000/api/sales/product-summary?date=2025-12-06', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📈 Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('📊 API Response:');
      console.log('  Success:', result.success);
      console.log('  Date:', result.date);
      console.log('  Company ID:', result.companyId);
      console.log('  Total Products:', result.totalProducts);
      console.log('  Production Groups:', result.productionGroups.length);
      console.log('  Ungrouped Products:', result.ungroupedProducts.length);
      
      // Check if this matches what you got
      console.log('\n🔍 Detailed breakdown:');
      if (result.productionGroups.length > 0) {
        console.log('  Production Groups:');
        result.productionGroups.forEach((group, i) => {
          console.log(`    ${i+1}. ${group.groupName}: ${group.products.length} products`);
        });
      }
      
      if (result.ungroupedProducts.length > 0) {
        console.log('  Ungrouped Products:');
        result.ungroupedProducts.forEach((product, i) => {
          console.log(`    ${i+1}. ${product.productName} (ID: ${product.productId})`);
        });
      }
      
      // Now test without date to see all products
      console.log('\n📊 Testing product summary API WITHOUT date...');
      const noDateResponse = await fetch('http://localhost:5000/api/sales/product-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (noDateResponse.ok) {
        const noDateResult = await noDateResponse.json();
        console.log('📊 API Response (no date):');
        console.log('  Total Products:', noDateResult.totalProducts);
        console.log('  Production Groups:', noDateResult.productionGroups.length);
        console.log('  Ungrouped Products:', noDateResult.ungroupedProducts.length);
        
        console.log('\n🤔 Comparison:');
        console.log(`  With date (2025-12-06): ${result.totalProducts} products`);
        console.log(`  Without date (all): ${noDateResult.totalProducts} products`);
        
        if (result.totalProducts < noDateResult.totalProducts) {
          console.log('\n🎯 ISSUE IDENTIFIED: Date filtering is limiting products!');
          console.log('   The ProductDailySummary table has records for other dates,');
          console.log('   but not for 2025-12-06, so only products with summaries');
          console.log('   for that specific date are being returned.');
        }
      } else {
        const errorResult = await noDateResponse.json();
        console.log('❌ No date API failed:', errorResult);
      }

    } else {
      const errorResult = await response.json();
      console.log('❌ API failed:', errorResult);
    }

  } catch (error) {
    console.error('🚨 Error:', error);
  }
};

testProductSummaryAPI();