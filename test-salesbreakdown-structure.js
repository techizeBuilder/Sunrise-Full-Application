console.log('🧪 Testing salesBreakdown in response structure\n');

const BASE_URL = 'http://localhost:5000';

async function testSalesBreakdownStructure() {
  try {
    console.log('Testing GET /api/sales/product-summary for salesBreakdown structure');
    const response = await fetch(`${BASE_URL}/api/sales/product-summary`, {
      headers: {
        'Authorization': 'Bearer fake-token-for-testing',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      console.log('\n📊 Response Structure:');
      console.log('✅ success:', data.success);
      console.log('📦 data (products):', Array.isArray(data.data) ? `Array[${data.data.length}]` : 'Not an array');
      console.log('🏭 productionGroups:', Array.isArray(data.productionGroups) ? `Array[${data.productionGroups.length}]` : 'Not present');
      console.log('📋 ungroupedProducts:', Array.isArray(data.ungroupedProducts) ? `Array[${data.ungroupedProducts.length}]` : 'Not present');
      console.log('📊 salesBreakdown:', Array.isArray(data.salesBreakdown) ? `Array[${data.salesBreakdown.length}]` : 'Not present or not an array');
      
      if (data.salesBreakdown) {
        console.log('\n🔍 SalesBreakdown Sample:');
        if (data.salesBreakdown.length > 0) {
          const sample = data.salesBreakdown[0];
          console.log('Sample salesBreakdown entry:');
          console.log('- productId:', sample.productId);
          console.log('- summary:', sample.summary);
          console.log('- orders count:', sample.orders?.length || 0);
        } else {
          console.log('salesBreakdown array is empty');
        }
      } else {
        console.log('\n❌ salesBreakdown is missing from response!');
      }

      // Check if any product has salesBreakdown nested (which would be wrong)
      if (data.data && data.data.length > 0) {
        const firstProduct = data.data[0];
        console.log('\n🔍 First Product Structure:');
        console.log('Keys:', Object.keys(firstProduct));
        if (firstProduct.salesBreakdown) {
          console.log('❌ ERROR: salesBreakdown found in product object (should be at root level)');
        } else {
          console.log('✅ Good: salesBreakdown not in product object');
        }
      }

      // Print full response structure (limited)
      console.log('\n📋 Full Response Keys:', Object.keys(data));
      
    } else {
      const errorText = await response.text();
      console.log('❌ Request failed:', response.status, response.statusText);
      console.log('Error:', errorText);
    }

  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testSalesBreakdownStructure();