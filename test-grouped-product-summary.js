import fetch from 'node-fetch';
import fs from 'fs';

async function testGroupedProductSummary() {
  try {
    // Use existing token if available
    let token;
    try {
      token = fs.readFileSync('token.txt', 'utf8').trim();
      console.log('🔑 Using existing token');
    } catch (e) {
      console.log('❌ No token file found. Please login first.');
      return;
    }

    console.log('🔍 Testing NEW grouped product summary API...');
    
    const response = await fetch('http://localhost:5000/api/sales/product-summary?date=2025-12-11', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log('\n📊 API Response Status:', response.status);
    console.log('✅ Success:', data.success);
    
    if (data.success) {
      console.log('\n🎯 NEW GROUPED FORMAT RESPONSE:');
      console.log('📅 Date:', data.date);
      console.log('🏢 Company ID:', data.companyId);
      console.log('📦 Total Products:', data.totalProducts);
      console.log('🏭 Production Groups Count:', data.productionGroups?.length || 0);
      console.log('📋 Ungrouped Products Count:', data.ungroupedProducts?.length || 0);
      
      if (data.productionGroups && data.productionGroups.length > 0) {
        console.log('\n🏭 PRODUCTION GROUPS:');
        data.productionGroups.forEach((group, index) => {
          console.log(`  ${index + 1}. Group ID: ${group.groupId}`);
          console.log(`     Group Name: ${group.groupName}`);
          console.log(`     Group Description: ${group.groupDescription}`);
          console.log(`     Products Count: ${group.products?.length || 0}`);
          
          if (group.products && group.products.length > 0) {
            console.log(`     First Product: ${group.products[0].productName}`);
          }
        });
      }
      
      if (data.ungroupedProducts && data.ungroupedProducts.length > 0) {
        console.log('\n📋 UNGROUPED PRODUCTS:');
        data.ungroupedProducts.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.productName} (ID: ${product._id})`);
        });
      }
      
      // Show sample response format
      console.log('\n📝 SAMPLE RESPONSE STRUCTURE:');
      console.log(JSON.stringify({
        success: data.success,
        date: data.date,
        companyId: data.companyId,
        totalProducts: data.totalProducts,
        productionGroups: data.productionGroups?.slice(0, 1).map(group => ({
          groupId: group.groupId,
          groupName: group.groupName,
          groupDescription: group.groupDescription,
          products: group.products?.slice(0, 1).map(p => ({
            _id: p._id,
            productName: p.productName,
            productionFinalBatches: p.productionFinalBatches,
            status: p.status
          }))
        })) || [],
        ungroupedProducts: data.ungroupedProducts?.slice(0, 1).map(p => ({
          _id: p._id,
          productName: p.productName,
          productionFinalBatches: p.productionFinalBatches,
          status: p.status
        })) || []
      }, null, 2));
      
    } else {
      console.log('❌ API Error:', data.message);
      console.log('Error details:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGroupedProductSummary();