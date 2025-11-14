import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

async function fixUnitHeadAssignment() {
  await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp');

  console.log('🔧 Fixing Unit Head company assignment...');

  // Find the current radhe user
  const unitHead = await User.findOne({ username: 'radhe' });
  console.log('Current radhe user ID:', unitHead?._id?.toString());
  console.log('Current company assignment:', unitHead?.companyId);

  // Get any available company
  const company = await Company.findOne({});
  console.log('Available company:', company?.name, 'ID:', company?._id?.toString());

  if (unitHead && company) {
    unitHead.companyId = company._id;
    await unitHead.save();
    
    console.log('✅ Updated Unit Head assignment:');
    console.log(`- User: ${unitHead.username} (${unitHead._id})`);
    console.log(`- Company: ${company.name} (${company._id})`);
    console.log(`- Location: ${company.city}`);
  } else {
    console.log('❌ Unit Head or Company not found');
  }

  mongoose.connection.close();
}

fixUnitHeadAssignment();