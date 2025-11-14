import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

const fixSalesCompanyAssignments = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Find Akshaya Foods company
    const akshayaCompany = await Company.findOne({ 
      name: { $regex: 'Akshaya', $options: 'i' } 
    });

    if (!akshayaCompany) {
      console.log('❌ Akshaya Foods company not found');
      return;
    }

    console.log('✅ Found Akshaya Foods company:', {
      id: akshayaCompany._id,
      name: akshayaCompany.name,
      city: akshayaCompany.city
    });

    // Find sales users who might not have company assignment
    const salesUsers = await User.find({
      role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
    });

    console.log('📋 Found sales-related users:');
    salesUsers.forEach(user => {
      console.log(`  ${user.username} (${user.role}) - Company: ${user.companyId || 'NOT ASSIGNED'}`);
    });

    // Find users without company assignment
    const usersWithoutCompany = salesUsers.filter(user => !user.companyId);
    
    if (usersWithoutCompany.length > 0) {
      console.log('🔧 Assigning company to users without assignment:');
      
      for (const user of usersWithoutCompany) {
        await User.findByIdAndUpdate(user._id, {
          companyId: akshayaCompany._id
        });
        console.log(`  ✅ Assigned ${user.username} to Akshaya Foods`);
      }
    } else {
      console.log('✅ All sales users already have company assignments');
    }

    // Verify all assignments
    const updatedUsers = await User.find({
      role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
    }).populate('companyId');

    console.log('\n📋 Final company assignments:');
    updatedUsers.forEach(user => {
      const companyName = user.companyId?.name || 'NOT ASSIGNED';
      console.log(`  ${user.username} (${user.role}) -> ${companyName}`);
    });

    console.log('\n✅ Company assignment fix completed!');

  } catch (error) {
    console.error('❌ Error fixing company assignments:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📤 MongoDB connection closed');
  }
};

// Run the fix
fixSalesCompanyAssignments();