// Debug company update validation
import mongoose from 'mongoose';
import { Company } from './server/models/Company.js';

// Connect to database
await mongoose.connect('mongodb://localhost:27017/sunrise', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const COMPANY_ID = '6914090118cf85f80ad856ba';

const updateData = {
  "unitName": "Sunrise Foods Pvt Ltd",
  "name": "Sunrise Foods",
  "legalName": "",
  "companyType": "Branch",
  "mobile": "+91-9876543212",
  "email": "bengaluru@sunrisefoods.com",
  "address": "No. 789, Electronic City Phase 1",
  "locationPin": "560100",
  "city": "Bengaluru",
  "state": "Karnataka",
  "pan": "",
  "gst": "29AABCS1234N2Z7",
  "isActive": true
};

try {
  console.log('🔍 Testing company update validation...');
  
  // First, let's see the current company data
  const currentCompany = await Company.findById(COMPANY_ID);
  if (!currentCompany) {
    console.log('❌ Company not found!');
    process.exit(1);
  }
  
  console.log('✅ Current company found:');
  console.log('   Name:', currentCompany.name);
  console.log('   Type:', currentCompany.companyType);
  console.log('   City:', currentCompany.city);
  
  // Test the update
  console.log('\n🧪 Testing update...');
  console.log('Update data:', updateData);
  
  // Clean up empty companyType to prevent validation errors
  if (updateData.companyType === '') {
    delete updateData.companyType;
    console.log('   Removed empty companyType');
  }
  
  const updatedCompany = await Company.findByIdAndUpdate(
    COMPANY_ID,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (updatedCompany) {
    console.log('✅ Update successful!');
    console.log('   Updated Name:', updatedCompany.name);
    console.log('   Updated Type:', updatedCompany.companyType);
    console.log('   Updated City:', updatedCompany.city);
  } else {
    console.log('❌ Update failed - company not found');
  }
  
} catch (error) {
  console.error('❌ Validation/Update error:', error.message);
  
  if (error.name === 'ValidationError') {
    console.log('\n📝 Validation errors:');
    Object.values(error.errors).forEach(err => {
      console.log(`   - ${err.path}: ${err.message}`);
    });
  }
  
  if (error.code === 11000) {
    console.log('\n🔄 Duplicate key error:', error.keyValue);
  }
  
  console.log('\nFull error:', error);
} finally {
  await mongoose.disconnect();
}