import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testIndentSummaryAPI() {
  try {
    console.log('🧪 Testing /api/sales/product-summary API for category information...\n');

    const response = await fetch('http://localhost:5000/api/sales/product-summary', {
      headers: {
        'Content-Type': 'application/json',
        // You would need to add proper authorization header in real usage:
        // 'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ API Response Structure:');
      console.log('📊 Success:', data.success);
      console.log('📅 Date:', data.date);
      console.log('🏢 Company ID:', data.companyId);
      console.log('📦 Total Products:', data.totalProducts);
      console.log('🏭 Production Groups:', data.productionGroups?.length || 0);
      console.log('🔄 Ungrouped Products:', data.ungroupedProducts?.length || 0);
      
      console.log('\n🔍 Production Groups Detail:');
      if (data.productionGroups && data.productionGroups.length > 0) {
        data.productionGroups.forEach((group, groupIndex) => {
          console.log(`\n📦 Group ${groupIndex + 1}:`);
          console.log(`   Group ID: ${group.groupId}`);
          console.log(`   Group Name: ${group.groupName}`);
          console.log(`   Description: ${group.groupDescription || 'No description'}`);
          console.log(`   Products: ${group.products.length}`);
          
          group.products.forEach((product, productIndex) => {
            console.log(`\n   🏷️  Product ${productIndex + 1}:`);
            console.log(`      ID: ${product.productId}`);
            console.log(`      Name: ${product.productName}`);
            console.log(`      Category: ${product.category || 'NOT SET'} ⭐`);
            console.log(`      Sub Category: ${product.subCategory || 'NOT SET'}`);
            console.log(`      Qty Per Batch: ${product.qtyPerBatch}`);
            console.log(`      Total Quantity: ${product.totalQuantity}`);
            console.log(`      Sales Breakdown: ${product.salesBreakdown?.length || 0} sales persons`);
          });
        });
      } else {
        console.log('   ❌ No production groups found');
      }

      console.log('\n🔍 Ungrouped Products Detail:');
      if (data.ungroupedProducts && data.ungroupedProducts.length > 0) {
        data.ungroupedProducts.forEach((product, productIndex) => {
          console.log(`\n🏷️  Ungrouped Product ${productIndex + 1}:`);
          console.log(`   ID: ${product.productId}`);
          console.log(`   Name: ${product.productName}`);
          console.log(`   Category: ${product.category || 'NOT SET'} ⭐`);
          console.log(`   Sub Category: ${product.subCategory || 'NOT SET'}`);
          console.log(`   Qty Per Batch: ${product.qtyPerBatch}`);
        });
      } else {
        console.log('   ❌ No ungrouped products found');
      }

      // Summary of category implementation
      console.log('\n📋 Category Implementation Summary:');
      let totalProductsWithCategory = 0;
      let totalProducts = 0;

      if (data.productionGroups) {
        data.productionGroups.forEach(group => {
          group.products.forEach(product => {
            totalProducts++;
            if (product.category && product.category !== 'Unknown') {
              totalProductsWithCategory++;
            }
          });
        });
      }

      if (data.ungroupedProducts) {
        data.ungroupedProducts.forEach(product => {
          totalProducts++;
          if (product.category && product.category !== 'Unknown') {
            totalProductsWithCategory++;
          }
        });
      }

      console.log(`✅ Products with category: ${totalProductsWithCategory}/${totalProducts}`);
      console.log(`📊 Category coverage: ${totalProducts > 0 ? Math.round((totalProductsWithCategory / totalProducts) * 100) : 0}%`);

    } else {
      console.log('❌ API call failed:', response.status, response.statusText);
      const errorData = await response.text();
      console.log('Error details:', errorData);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('1. Server is running on http://localhost:5000');
    console.log('2. You have proper authentication (add Bearer token if needed)');
    console.log('3. ProductDailySummary data exists in the database');
  }
}

testIndentSummaryAPI();