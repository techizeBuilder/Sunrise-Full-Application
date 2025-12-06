import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDuplicates() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sfs_inventory');
    console.log('✅ Connected to database');
    
    const targetCompany = '6914090118cf85f80ad856bc';
    
    console.log('\n🔍 Checking for duplicate products...');
    
    // Get all records for the target company
    const allRecords = await ProductDailySummary.find({ 
      companyId: new mongoose.Types.ObjectId(targetCompany) 
    }).lean();
    
    console.log(`📊 Total records for company: ${allRecords.length}`);
    
    // Group by product name to find duplicates
    const productGroups = {};
    allRecords.forEach(record => {
      if (!productGroups[record.productName]) {
        productGroups[record.productName] = [];
      }
      productGroups[record.productName].push(record);
    });
    
    console.log(`📦 Unique product names: ${Object.keys(productGroups).length}`);
    
    // Check for products with NULL productId
    const nullProductIdRecords = allRecords.filter(record => !record.productId);
    console.log(`\n🚨 Records with NULL productId: ${nullProductIdRecords.length}`);
    
    // Check for valid productId records
    const validProductIdRecords = allRecords.filter(record => record.productId);
    console.log(`✅ Records with valid productId: ${validProductIdRecords.length}`);
    
    // Group valid records by productId to understand the structure
    const productIdGroups = {};
    validProductIdRecords.forEach(record => {
      const prodId = record.productId.toString();
      if (!productIdGroups[prodId]) {
        productIdGroups[prodId] = [];
      }
      productIdGroups[prodId].push(record);
    });
    
    console.log(`\n📦 Unique productIds with valid records: ${Object.keys(productIdGroups).length}`);
    
    // This is the key insight - if there are 52 valid records but only a few unique productIds,
    // then we have multiple summary records per product (different dates)
    // The API should be deduplicating by productId, not returning all records
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDuplicates();