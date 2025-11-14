import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

async function updateUnitHeadCompany() {
  await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp');

  console.log('🔄 Updating Unit Head company assignment...');

  // Find the Unit Head
  const unitHead = await User.findOne({ username: 'radhe' });
  
  if (unitHead && unitHead.companyId) {
    // Get the company details
    const company = await Company.findById(unitHead.companyId);
    
    console.log('✅ Unit Head Company Assignment:');
    console.log('- Unit Head:', unitHead.username);
    console.log('- Company:', company.name);
    console.log('- Unit Name:', company.unitName);
    console.log('- City:', company.city);
    console.log('- Address:', company.address);
    console.log('- Location String:', `${company.name}, ${company.city}`);
  }

  mongoose.connection.close();
}

updateUnitHeadCompany();