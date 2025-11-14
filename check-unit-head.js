import mongoose from 'mongoose';
import User from './server/models/User.js';

async function checkUnitHead() {
  await mongoose.connect('mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp');

  console.log('🔍 Checking Unit Head user: radhe');
  const unitHead = await User.findOne({ username: 'radhe' });

  if (unitHead) {
    console.log('✅ Found Unit Head:');
    console.log('- Username:', unitHead.username);
    console.log('- Email:', unitHead.email);
    console.log('- Role:', unitHead.role);
    console.log('- Unit/Location:', unitHead.unit);
    console.log('- Company:', unitHead.company);
    console.log('- Active:', unitHead.isActive);
  } else {
    console.log('❌ Unit Head user "radhe" not found');
    
    // Check all users with Unit Head role
    const allUnitHeads = await User.find({ role: 'Unit Head' });
    console.log('\n📊 All Unit Head users:');
    allUnitHeads.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - Unit: ${user.unit || 'NONE'}`);
    });
  }

  mongoose.connection.close();
}

checkUnitHead();