import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';

const checkProductSummaryData = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/inventory-management');
    console.log('📊 Connected to database');

    // Find records with null productId
    const nullProductIdRecords = await ProductDailySummary.find({
      productId: null
    }).limit(10);

    console.log('🚨 Records with null productId:', nullProductIdRecords.length);
    if (nullProductIdRecords.length > 0) {
      console.log('🔍 Sample null records:');
      nullProductIdRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record._id}, Date: ${record.date}, ProductName: ${record.productName}`);
      });
    }

    // Find records with missing productId field
    const missingProductIdRecords = await ProductDailySummary.find({
      productId: { $exists: false }
    }).limit(10);

    console.log('🚨 Records with missing productId field:', missingProductIdRecords.length);

    // Count total records
    const totalRecords = await ProductDailySummary.countDocuments();
    console.log('📈 Total ProductDailySummary records:', totalRecords);

    // Get some sample valid records
    const validRecords = await ProductDailySummary.find({
      productId: { $ne: null, $exists: true }
    }).limit(3).populate('productId', 'name');

    console.log('✅ Sample valid records:', validRecords.length);
    if (validRecords.length > 0) {
      console.log('🔍 Valid records:');
      validRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record._id}, Product: ${record.productId?.name || 'N/A'}, ProductName: ${record.productName}`);
      });
    }

    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

checkProductSummaryData();