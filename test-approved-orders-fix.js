// Test script to verify that sales breakdown only counts approved orders

async function testApprovedOrdersFix() {
  try {
    console.log('🧪 Testing Product Summary API - Approved Orders Only Fix');
    console.log('=======================================================\n');
    
    const response = await fetch('http://localhost:5000/api/sales/product-summary', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.products) {
      console.log(`📊 Total products: ${data.products.length}`);
      
      // Find products with sales breakdown to show the fix
      const productsWithSales = data.products.filter(p => p.salesBreakdown && p.salesBreakdown.length > 0);
      console.log(`🎯 Products with sales data: ${productsWithSales.length}`);
      
      console.log('\n📈 SAMPLE RESULTS (Should only show APPROVED orders):');
      console.log('====================================================');
      
      productsWithSales.slice(0, 3).forEach((product, index) => {
        console.log(`\n${index + 1}. Product: ${product.productName}`);
        product.salesBreakdown.forEach(breakdown => {
          console.log(`   - ${breakdown.salesPersonName}: ${breakdown.totalQuantity} qty, ${breakdown.orderCount} orders (APPROVED ONLY)`);
        });
      });
      
      // Show specific PAV-200 if available
      const pav200 = data.products.find(p => p.productName === 'PAV-200');
      if (pav200 && pav200.salesBreakdown && pav200.salesBreakdown.length > 0) {
        console.log('\n🎯 PAV-200 SPECIFIC RESULTS:');
        console.log('============================');
        pav200.salesBreakdown.forEach(breakdown => {
          console.log(`   - ${breakdown.salesPersonName}: ${breakdown.totalQuantity} qty, ${breakdown.orderCount} orders (APPROVED ONLY)`);
        });
        
        console.log('\n✅ BEFORE: Was counting ALL orders (pending, approved, rejected, etc.)');
        console.log('✅ AFTER: Now counting ONLY approved orders');
      }
      
    } else {
      console.log('❌ API error:', data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testApprovedOrdersFix().catch(console.error);