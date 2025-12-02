// Script to get valid Company IDs for Excel import

const mongoose = require('mongoose');

// Company schema (simplified)
const companySchema = new mongoose.Schema({
  name: String,
  city: String,
  state: String,
  unitName: String
});

const Company = mongoose.model('Company', companySchema);

async function getValidCompanyIds() {
  try {
    // Connect to your database
    await mongoose.connect('mongodb://localhost:27017/sunriseInventory');
    console.log('✅ Connected to database\n');
    
    // Get all active companies
    const companies = await Company.find({ isActive: { $ne: false } })
      .select('_id name city state unitName')
      .sort({ name: 1 });
    
    console.log('📋 VALID COMPANY IDs FOR EXCEL IMPORT:');
    console.log('=' .repeat(60));
    
    companies.forEach((company, index) => {
      console.log(`${index + 1}. Company: ${company.name}`);
      console.log(`   Location: ${company.city}, ${company.state}`);
      console.log(`   Store Location ID: ${company._id}`);
      console.log(`   Unit: ${company.unitName || 'N/A'}`);
      console.log('   ' + '-'.repeat(50));
    });
    
    console.log('\n🎯 FOR YOUR EXCEL FILE:');
    console.log('Copy the "Store Location ID" values above and paste them in your Excel file.');
    console.log('Example:');
    companies.slice(0, 2).forEach((company, index) => {
      console.log(`Row ${index + 2}: Store Location ID = ${company._id}`);
    });
    
    console.log('\n❌ INVALID IDs (what you currently have):');
    console.log('691409011&cf85f80ad856b9  ← Contains & and wrong format');
    console.log('691409011&cf85f80ad856b10 ← Contains & and wrong format');
    
    console.log('\n✅ VALID FORMAT (24 characters, hex only):');
    console.log('507f1f77bcf86cd799439011 ← Example valid ObjectId');
    console.log(companies[0]?._id + ' ← Your actual company ID');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

getValidCompanyIds();