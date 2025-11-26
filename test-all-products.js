import fetch from 'node-fetch';
import fs from 'fs';

const testAllProductsIncludingEmpty = async () => {
  try {
    console.log('🔐 Attempting login...');
    
    // Login first
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'unit_manager',
        password: '12345678'
      })
    });

    const loginResult = await loginResponse.json();
    if (!loginResult.success || !loginResult.token) {
      console.error('❌ Login failed');
      return;
    }

    // Test product summary API with today's date
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📊 Testing Product Summary for ${today}...`);
    
    const response = await fetch(`http://localhost:5000/api/sales/product-summary?date=${today}`, {
      headers: {
        'Authorization': `Bearer ${loginResult.token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log(`📈 Status: ${response.status}`);
    
    if (result.success && result.products) {
      console.log(`📦 Total products returned: ${result.products.length}`);
      
      result.products.forEach((product, index) => {
        const hasData = product.salesBreakdown && product.salesBreakdown.length > 0;
        console.log(`\n${index + 1}. Product: ${product.productName}`);
        console.log(`   Sales Breakdown: ${hasData ? product.salesBreakdown.length + ' entries' : 'EMPTY (should show 0)'}`);
        
        if (hasData) {
          product.salesBreakdown.forEach(breakdown => {
            console.log(`     - ${breakdown.salesPersonName}: ${breakdown.totalQuantity} qty, ${breakdown.orderCount} orders`);
          });
        } else {
          console.log(`     - No sales data (should display as 0 in UI)`);
        }
        
        console.log(`   Summary - Total Indent: ${product.summary.totalIndent}`);
        console.log(`   Summary - To Be Produced: ${product.summary.toBeProducedDay}`);
      });
      
      // Show transformation simulation
      console.log('\n🔄 TRANSFORMATION SIMULATION:');
      const transformedData = result.products.map(product => {
        const hasSalesData = product.salesBreakdown && product.salesBreakdown.length > 0;
        
        return {
          productName: product.productName,
          totalOrders: hasSalesData ? product.salesBreakdown.reduce((sum, sp) => sum + sp.orderCount, 0) : 0,
          totalQuantity: hasSalesData ? product.salesBreakdown.reduce((sum, sp) => sum + sp.totalQuantity, 0) : 0,
          salesPersons: hasSalesData ? product.salesBreakdown : []
        };
      });
      
      transformedData.forEach(product => {
        console.log(`📋 ${product.productName}: ${product.totalQuantity} total qty, ${product.totalOrders} orders, ${product.salesPersons.length} sales entries`);
      });
      
    } else {
      console.log(`   Error:`, result.message || result.error);
    }

  } catch (error) {
    console.error('🚨 Test error:', error);
  }
};

testAllProductsIncludingEmpty();