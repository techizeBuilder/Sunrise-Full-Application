// Debug script to check what ProductDailySummary records exist
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/sunrize', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the ProductDailySummary schema (simplified)
const productDailySummarySchema = new mongoose.Schema({
  date: Date,
  productName: String,
  companyId: mongoose.Schema.Types.ObjectId,
  productId: mongoose.Schema.Types.ObjectId,
  qtyPerBatch: Number
});

const ProductDailySummary = mongoose.model('ProductDailySummary', productDailySummarySchema);

async function checkData() {
  try {
    console.log('=== Checking ProductDailySummary Data ===\n');
    
    // Count total records
    const totalCount = await ProductDailySummary.countDocuments();
    console.log('📊 Total ProductDailySummary records:', totalCount);
    
    // Get distinct dates
    const distinctDates = await ProductDailySummary.distinct('date');
    console.log('📅 Distinct dates:');
    distinctDates.forEach(date => {
      console.log('  -', date);
    });
    
    // Get some sample records
    console.log('\n📋 Sample records:');
    const samples = await ProductDailySummary.find({})
      .limit(5)
      .select('date productName companyId productId qtyPerBatch');
    
    samples.forEach((record, index) => {
      console.log(`  ${index + 1}. Date: ${record.date}, Product: ${record.productName}, Company: ${record.companyId}, ProductId: ${record.productId ? 'exists' : 'null'}`);
    });
    
    // Check records without date filter
    const allRecords = await ProductDailySummary.find({}).limit(10);
    console.log('\n🔍 All records (first 10):');
    allRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.productName} - ${record.date} - Company: ${record.companyId}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkData();