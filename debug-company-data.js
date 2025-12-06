import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkData() {
  try {
    console.log('🔗 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sfs_inventory');
    console.log('✅ Connected to database');
    
    console.log('\n🔍 Checking ProductDailySummary records...');
    
    const totalCount = await ProductDailySummary.countDocuments();
    console.log('📊 Total ProductDailySummary records:', totalCount);
    
    // Check by company
    const companies = await ProductDailySummary.distinct('companyId');
    console.log('\n🏢 Companies with summary data:', companies.length);
    
    for (const companyId of companies) {
      const count = await ProductDailySummary.countDocuments({ companyId });
      console.log(`  Company ${companyId}: ${count} records`);
    }
    
    // Check the specific company from your API response
    const targetCompany = '6914090118cf85f80ad856bc';
    const targetCompanyCount = await ProductDailySummary.countDocuments({ 
      companyId: new mongoose.Types.ObjectId(targetCompany) 
    });
    console.log(`\n🎯 Target company (${targetCompany}) records: ${targetCompanyCount}`);
    
    // Get sample records for target company
    const targetRecords = await ProductDailySummary.find({ 
      companyId: new mongoose.Types.ObjectId(targetCompany) 
    }).limit(10).lean();
    
    console.log('\n📋 Records for target company:');
    targetRecords.forEach((rec, i) => {
      console.log(`  ${i+1}. Product: ${rec.productName}, ProductId: ${rec.productId ? 'exists' : 'NULL'}, Date: ${rec.date}`);
    });
    
    // Check if there are products with NULL productId
    const nullProductIdCount = await ProductDailySummary.countDocuments({ 
      companyId: new mongoose.Types.ObjectId(targetCompany),
      productId: null 
    });
    console.log(`\n🚨 Records with NULL productId: ${nullProductIdCount}`);
    
    // Get all records with valid productId
    const validProductIdCount = await ProductDailySummary.countDocuments({ 
      companyId: new mongoose.Types.ObjectId(targetCompany),
      productId: { $ne: null } 
    });
    console.log(`✅ Records with valid productId: ${validProductIdCount}`);
    
    if (validProductIdCount > 2) {
      console.log('\n🔍 Sample valid records:');
      const validRecords = await ProductDailySummary.find({ 
        companyId: new mongoose.Types.ObjectId(targetCompany),
        productId: { $ne: null } 
      }).populate('productId', 'name').limit(10).lean();
      
      validRecords.forEach((rec, i) => {
        console.log(`  ${i+1}. Product: ${rec.productName}, ProductId: ${rec.productId?._id}, ProductName from Item: ${rec.productId?.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();