// Check company details and locations
import mongoose from 'mongoose';
import { Company } from './server/models/Company.js';
import User from './server/models/User.js';
import { Item } from './server/models/Inventory.js';

const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function checkCompanyDetails() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check jeetu01 user and company
    const jeetuUser = await User.findOne({ username: 'jeetu01' });
    if (jeetuUser) {
      const jeetuCompany = await Company.findById(jeetuUser.companyId);
      console.log('\n👤 jeetu01 User Details:');
      console.log(`   Username: ${jeetuUser.username}`);
      console.log(`   Company ID: ${jeetuUser.companyId}`);
      if (jeetuCompany) {
        console.log(`   Company Name: ${jeetuCompany.name}`);
        console.log(`   Unit Name: ${jeetuCompany.unitName}`);
        console.log(`   City: ${jeetuCompany.city}`);
        console.log(`   State: ${jeetuCompany.state}`);
        console.log(`   Address: ${jeetuCompany.address}`);
      }
    }

    // Check PAV-400 item and its company
    const pavItem = await Item.findOne({ name: 'PAV-400' });
    if (pavItem) {
      const pavCompany = await Company.findById(pavItem.store);
      console.log('\n📦 PAV-400 Item Details:');
      console.log(`   Item Name: ${pavItem.name}`);
      console.log(`   Item Code: ${pavItem.code}`);
      console.log(`   Store ID: ${pavItem.store}`);
      if (pavCompany) {
        console.log(`   Store Company Name: ${pavCompany.name}`);
        console.log(`   Store Unit Name: ${pavCompany.unitName}`);
        console.log(`   Store City: ${pavCompany.city}`);
        console.log(`   Store State: ${pavCompany.state}`);
        console.log(`   Store Address: ${pavCompany.address}`);
      }
    }

    // Check all Sunrise Foods companies
    const sunriseCompanies = await Company.find({
      $or: [
        { name: { $regex: 'Sunrise', $options: 'i' } },
        { unitName: { $regex: 'Sunrise', $options: 'i' } }
      ]
    });

    console.log('\n🏢 All Sunrise Foods Companies:');
    for (let i = 0; i < sunriseCompanies.length; i++) {
      const company = sunriseCompanies[i];
      const itemCount = await Item.countDocuments({ store: company._id });
      console.log(`\n   ${i + 1}. Company ID: ${company._id}`);
      console.log(`      Name: ${company.name}`);
      console.log(`      Unit Name: ${company.unitName}`);
      console.log(`      Location: ${company.city}, ${company.state}`);
      console.log(`      Address: ${company.address}`);
      console.log(`      Items assigned: ${itemCount}`);
    }

    // Check if locations are same but companies are different
    console.log('\n🔍 Location Analysis:');
    const bengaluruCompanies = sunriseCompanies.filter(c => 
      c.city?.toLowerCase().includes('bengaluru') || 
      c.city?.toLowerCase().includes('bangalore')
    );
    
    console.log(`   Found ${bengaluruCompanies.length} companies in Bengaluru/Bangalore:`);
    bengaluruCompanies.forEach((company, index) => {
      console.log(`     ${index + 1}. ${company.name} (${company._id})`);
      console.log(`        City: ${company.city}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkCompanyDetails();