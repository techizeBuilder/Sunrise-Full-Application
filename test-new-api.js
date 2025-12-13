console.log('🧪 Testing Updated Product Summary API with ProductDetailsDailySummary\n');

const BASE_URL = 'http://localhost:5000';

async function testAPI() {
  try {
    // Test 1: GET without date (should use today's date)
    console.log('1. Testing GET /api/sales/product-summary (no date - should use today)');
    const response1 = await fetch(`${BASE_URL}/api/sales/product-summary`, {
      headers: {
        'Authorization': 'Bearer fake-token-for-testing',
        'Content-Type': 'application/json'
      }
    });

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Success:', data1.success);
      console.log('📊 Total products:', data1.totalProducts);
      console.log('📈 Production groups:', data1.productionGroups?.length || 0);
      
      if (data1.data && data1.data.length > 0) {
        const sample = data1.data[0];
        console.log('📋 Sample product:');
        console.log('  - Name:', sample.productName);
        console.log('  - Has daily data:', sample.hasDailyData);
        console.log('  - Daily fields:', {
          packing: sample.packing,
          physicalStock: sample.physicalStock,
          totalIndent: sample.totalIndent
        });
      }
    } else {
      console.log('❌ Request failed:', response1.status, response1.statusText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: GET with specific date
    const testDate = '2025-12-10';
    console.log(`2. Testing GET /api/sales/product-summary?date=${testDate}`);
    const response2 = await fetch(`${BASE_URL}/api/sales/product-summary?date=${testDate}`, {
      headers: {
        'Authorization': 'Bearer fake-token-for-testing',
        'Content-Type': 'application/json'
      }
    });

    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Success:', data2.success);
      console.log('📊 Total products:', data2.totalProducts);
      console.log('📈 Products with daily data:', data2.data?.filter(p => p.hasDailyData).length || 0);
    } else {
      console.log('❌ Request failed:', response2.status, response2.statusText);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: POST update-product-summary
    console.log('3. Testing POST /api/sales/update-product-summary');
    const updateData = {
      date: '2025-12-10',
      productId: '69329ff9f1863d0ded907497', // Example product ID
      updates: {
        packing: 25,
        physicalStock: 5,
        batchAdjusted: 1,
        toBeProducedDay: 70
      }
    };

    const response3 = await fetch(`${BASE_URL}/api/sales/update-product-summary`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer fake-token-for-testing',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (response3.ok) {
      const data3 = await response3.json();
      console.log('✅ Update success:', data3.success);
      console.log('📝 Updated product:', data3.data?.productName);
      console.log('🔢 Updated values:', {
        packing: data3.data?.packing,
        physicalStock: data3.data?.physicalStock,
        productionFinalBatches: data3.data?.productionFinalBatches
      });
    } else {
      console.log('❌ Update failed:', response3.status, response3.statusText);
    }

  } catch (error) {
    console.error('🚨 Test error:', error.message);
  }
}

testAPI();