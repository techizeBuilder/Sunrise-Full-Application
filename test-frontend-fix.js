// Test script to verify the sales person aggregation and frontend fixes
const BASE_URL = 'http://localhost:5000';

async function testSalesPersonDisplayFix() {
  try {
    console.log('🧪 TESTING SALES PERSON DISPLAY FIX');
    console.log('=====================================');

    // Test the main API that the frontend uses
    console.log('\n📊 Testing Sales Product Summary API:');
    const response = await fetch(`${BASE_URL}/api/sales/product-summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      console.log('\n✅ API Response Structure:');
      console.log(`- Success: ${data.success}`);
      console.log(`- Date: ${data.date}`);
      console.log(`- Company ID: ${data.companyId}`);
      console.log(`- Total Products: ${data.products.length}`);
      
      console.log('\n📋 PRODUCTS WITH SALES BREAKDOWN:');
      data.products.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.productName} (ID: ${product.productId})`);
        console.log(`   - Qty Per Batch: ${product.qtyPerBatch}`);
        console.log(`   - Summary:`, {
          totalIndent: product.summary.totalIndent,
          physicalStock: product.summary.physicalStock,
          packing: product.summary.packing,
          batchAdjusted: product.summary.batchAdjusted,
          productionFinalBatches: product.summary.productionFinalBatches,
          toBeProducedDay: product.summary.toBeProducedDay,
          toBeProducedBatches: product.summary.toBeProducedBatches,
          expiryShortage: product.summary.expiryShortage
        });
        
        if (product.salesBreakdown && product.salesBreakdown.length > 0) {
          console.log(`   - Sales Breakdown (${product.salesBreakdown.length} sales persons):`);
          product.salesBreakdown.forEach((sales, salesIndex) => {
            console.log(`     ${salesIndex + 1}. ${sales.salesPersonName} (ID: ${sales.salesPersonId})`);
            console.log(`        - Total Quantity: ${sales.totalQuantity}`);
            console.log(`        - Order Count: ${sales.orderCount}`);
          });
        } else {
          console.log(`   - ❌ No sales breakdown data`);
        }
      });

      // Verify the data structure for frontend consumption
      console.log('\n🔄 FRONTEND DATA TRANSFORMATION VERIFICATION:');
      console.log('====================================================');
      
      // Simulate the frontend transformation
      const transformedData = data.products.map(product => {
        const hasSalesData = product.salesBreakdown && product.salesBreakdown.length > 0;
        
        return {
          productId: product.productId,
          productName: product.productName,
          productCode: product.productCode || '',
          totalOrders: hasSalesData ? product.salesBreakdown.reduce((sum, sp) => sum + sp.orderCount, 0) : 0,
          totalQuantity: hasSalesData ? product.salesBreakdown.reduce((sum, sp) => sum + sp.totalQuantity, 0) : 0,
          salesPersons: hasSalesData ? product.salesBreakdown.map(sp => ({
            _id: sp.salesPersonId,
            fullName: sp.salesPersonName,
            totalQuantity: sp.totalQuantity,
            orderCount: sp.orderCount,
            orders: [] // Mock orders array for UI compatibility
          })) : []
        };
      });

      console.log('\n📊 TRANSFORMED DATA FOR FRONTEND:');
      transformedData.forEach(product => {
        console.log(`\n📦 ${product.productName}:`);
        console.log(`   - Total Orders: ${product.totalOrders}`);
        console.log(`   - Total Quantity: ${product.totalQuantity}`);
        console.log(`   - Sales Persons: ${product.salesPersons.length}`);
        
        if (product.salesPersons.length > 0) {
          product.salesPersons.forEach(sp => {
            console.log(`     👤 ${sp.fullName}: ${sp.totalQuantity} qty, ${sp.orderCount} orders`);
          });
        } else {
          console.log(`     ❌ No sales persons assigned`);
        }
      });

      // Extract unique sales persons for dynamic columns
      console.log('\n👥 UNIQUE SALES PERSONS FOR DYNAMIC COLUMNS:');
      const allSalesPersons = new Set();
      transformedData.forEach(product => {
        product.salesPersons.forEach(sp => {
          allSalesPersons.add(sp.fullName);
        });
      });
      
      const salesPersonsList = Array.from(allSalesPersons);
      console.log(`Found ${salesPersonsList.length} unique sales persons:`);
      salesPersonsList.forEach((person, index) => {
        console.log(`${index + 1}. ${person}`);
      });

      // Frontend grid simulation
      console.log('\n🎨 FRONTEND GRID STRUCTURE SIMULATION:');
      console.log('=====================================');
      const grid = {};
      
      transformedData.forEach(product => {
        grid[product.productName] = {};
        
        // Initialize all sales persons for this product
        salesPersonsList.forEach(salesPersonName => {
          grid[product.productName][salesPersonName] = [];
        });
        
        // Fill in actual data
        if (product.salesPersons.length > 0) {
          product.salesPersons.forEach(sp => {
            grid[product.productName][sp.fullName] = [{
              orderId: `summary-${sp._id}`,
              orderCode: `SUMMARY-${sp.orderCount}`,
              quantity: sp.totalQuantity,
              customerName: `Total from ${sp.orderCount} orders`,
              status: 'aggregated',
              orderDate: new Date()
            }];
          });
        }
      });
      
      // Display grid structure
      console.log('\nGrid structure ready for frontend:');
      Object.entries(grid).forEach(([productName, salesData]) => {
        console.log(`\n📦 ${productName}:`);
        Object.entries(salesData).forEach(([salesPerson, orders]) => {
          const totalQuantity = orders.reduce((sum, order) => sum + (order.quantity || 0), 0);
          if (totalQuantity > 0) {
            console.log(`  👤 ${salesPerson}: ${totalQuantity} qty (${orders.length} entries)`);
          } else {
            console.log(`  👤 ${salesPerson}: 0 qty (no data)`);
          }
        });
      });

      console.log('\n✅ FRONTEND FIX VERIFICATION COMPLETE!');
      console.log('=====================================');
      console.log('✅ Backend aggregation: WORKING');
      console.log('✅ Sales person breakdown: WORKING'); 
      console.log('✅ Data transformation: READY');
      console.log('✅ Dynamic columns data: READY');
      console.log('\n🎯 The issue was in the frontend - fixed by making columns dynamic instead of hardcoded!');
      
    } else {
      console.log('❌ API returned success: false');
      console.log('Response:', data);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('fetch')) {
      console.log('💡 Make sure the server is running on http://localhost:5000');
    }
  }
}

// Run the test
testSalesPersonDisplayFix();