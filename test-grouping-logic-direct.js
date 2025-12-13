import mongoose from 'mongoose';
import ProductionGroup from './server/models/ProductionGroup.js';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import ProductDetailsDailySummary from './server/models/ProductDetailsDailySummary.js';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

async function testGroupingLogicDirectly() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Simulate the controller logic
    const filterCompanyId = '6914090118cf85f80ad856bc';
    const summaryDate = new Date('2025-12-11');

    console.log('\n🔍 Testing grouping logic for company:', filterCompanyId);

    // Step 1: Get master product data (without company population)
    const masterFilter = {
      companyId: new mongoose.Types.ObjectId(filterCompanyId)
    };

    const masterProducts = await ProductDailySummary.find(masterFilter)
      .populate('productId', 'name category subCategory')
      .sort({ productName: 1 });

    console.log('📊 Master products found:', masterProducts.length);

    // Step 2: Get production groups
    const productGroups = await ProductionGroup.find({
      company: filterCompanyId,
      isActive: true
    }).populate('items');

    console.log('🏭 Production groups found:', productGroups.length);

    // Step 3: Test the grouping logic
    const validProducts = masterProducts.filter(p => 
      p.productId && p.productId._id && p.productName
    );

    console.log('📦 Valid products for grouping:', validProducts.length);

    const productionGroupsData = productGroups.map(group => {
      console.log(`\n🔍 Processing group: ${group.name}`);
      console.log(`   Group has ${group.items.length} items`);
      
      const groupProducts = validProducts.filter(product => {
        const isMatch = group.items.some(item => 
          product.productId && 
          item._id.toString() === product.productId._id.toString()
        );
        
        if (isMatch) {
          console.log(`   ✅ Match found: ${product.productName} (${product.productId._id})`);
        }
        
        return isMatch;
      });

      console.log(`   📋 Group "${group.name}" has ${groupProducts.length} matched products`);

      return {
        groupId: group._id,
        groupName: group.name,
        groupDescription: group.description || "",
        products: groupProducts.map(product => ({
          _id: product._id,
          productId: product.productId,
          productName: product.productName,
          companyId: product.companyId,
          date: summaryDate,
          qtyPerBatch: product.qtyPerBatch || 0,
          productionFinalBatches: product.productionFinalBatches || 0,
          status: product.status || 'pending'
        }))
      };
    });

    // Step 4: Calculate ungrouped products
    const groupedProductIds = new Set();
    productGroups.forEach(group => {
      group.items.forEach(item => {
        groupedProductIds.add(item._id.toString());
      });
    });

    const ungroupedProducts = validProducts
      .filter(product => !groupedProductIds.has(product.productId._id.toString()))
      .map(product => ({
        _id: product._id,
        productName: product.productName,
        productId: product.productId,
        status: product.status || 'pending'
      }));

    console.log('\n📊 FINAL RESULTS:');
    console.log('🏭 Production groups with products:', productionGroupsData.length);
    console.log('📋 Ungrouped products:', ungroupedProducts.length);
    
    // Show detailed results
    productionGroupsData.forEach((group, index) => {
      console.log(`\n${index + 1}. Group: ${group.groupName}`);
      console.log(`   Products: ${group.products.length}`);
      group.products.forEach((product, pIndex) => {
        console.log(`   ${pIndex + 1}. ${product.productName}`);
      });
    });

    if (ungroupedProducts.length > 0) {
      console.log('\n📋 Ungrouped Products:');
      ungroupedProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.productName}`);
      });
    }

    // Final response structure
    const responseData = {
      success: true,
      date: "2025-12-11",
      companyId: filterCompanyId,
      totalProducts: validProducts.length,
      productionGroups: productionGroupsData,
      ungroupedProducts: ungroupedProducts
    };

    console.log('\n🎯 Final Response Structure:');
    console.log(JSON.stringify(responseData, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testGroupingLogicDirectly();