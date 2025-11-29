import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';

async function checkDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sunrize');
    console.log('Connected to MongoDB');
    
    // Count total records
    const totalCount = await ProductDailySummary.countDocuments();
    console.log(`\n📊 Total ProductDailySummary records: ${totalCount}`);
    
    // Get distinct dates
    const distinctDates = await ProductDailySummary.distinct('date');
    console.log(`\n📅 Available dates (${distinctDates.length}):`);
    distinctDates.sort().forEach(date => {
      console.log(`  - ${date}`);
    });
    
    // Count by company
    const companyCounts = await ProductDailySummary.aggregate([
      { $group: { _id: '$companyId', count: { $sum: 1 } } }
    ]);
    console.log(`\n🏢 Records by company:`);
    companyCounts.forEach(comp => {
      console.log(`  - Company ${comp._id}: ${comp.count} records`);
    });
    
    // Show sample records
    console.log(`\n📋 Sample records (first 5):`);
    const samples = await ProductDailySummary.find({})
      .limit(5)
      .select('date productName companyId productId')
      .lean();
    
    samples.forEach((record, i) => {
      console.log(`  ${i+1}. ${record.productName} | ${record.date} | Company: ${record.companyId} | ProductId: ${record.productId ? 'exists' : 'NULL'}`);
    });
    
    // Test the exact filter that would be used for your company
    const companyId = '6914090118cf85f80ad856bc';
    console.log(`\n🔍 Testing filter for company ${companyId}:`);
    
    const companyRecords = await ProductDailySummary.find({
      companyId: new mongoose.Types.ObjectId(companyId)
    }).countDocuments();
    console.log(`  - Records for this company: ${companyRecords}`);
    
    if (companyRecords > 0) {
      const sampleForCompany = await ProductDailySummary.findOne({
        companyId: new mongoose.Types.ObjectId(companyId)
      }).select('date productName');
      console.log(`  - Sample: ${sampleForCompany.productName} on ${sampleForCompany.date}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkDatabase();