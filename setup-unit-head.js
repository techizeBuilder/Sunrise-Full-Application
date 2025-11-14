import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

async function setupUnitHead() {
  await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp');

  console.log('🔍 Setting up Unit Head with company assignment...');

  // Check existing companies
  const companies = await Company.find({}).select('name location city');
  console.log('\n📊 Available companies:');
  companies.forEach((company, index) => {
    console.log(`${index + 1}. ${company.name} - ${company.location || 'No Location'} (${company.city || 'No City'})`);
  });

  if (companies.length === 0) {
    console.log('❌ No companies found. Creating a test company...');
    
    const testCompany = new Company({
      name: 'Sunrise Foods',
      location: 'Bengaluru, Karnataka',
      city: 'Bengaluru',
      address: '123 Tech Park, Bengaluru',
      phone: '080-12345678',
      email: 'info@sunrisefoods.com',
      isActive: true
    });
    
    await testCompany.save();
    console.log('✅ Created test company:', testCompany.name);
    companies.push(testCompany);
  }

  // Assign first company to Unit Head
  const unitHead = await User.findOne({ username: 'radhe' });
  if (unitHead) {
    unitHead.companyId = companies[0]._id;
    await unitHead.save();
    
    console.log('\n✅ Updated Unit Head:');
    console.log('- Username:', unitHead.username);
    console.log('- Assigned Company ID:', unitHead.companyId);
    console.log('- Company Name:', companies[0].name);
    console.log('- Company Location:', companies[0].location);
  }

  mongoose.connection.close();
}

setupUnitHead();