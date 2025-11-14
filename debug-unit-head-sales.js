import mongoose from 'mongoose';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

const debugUnitHeadSalesPersons = async () => {
  try {
    const mongoURI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');

    // Find radhe user and their company
    const radheUser = await User.findOne({ username: 'radhe' }).populate('companyId');
    console.log('Radhe user:', {
      username: radheUser.username,
      role: radheUser.role,
      companyId: radheUser.companyId._id.toString(),
      companyName: radheUser.companyId.name
    });

    // Find all sales persons from the same company
    const salesPersonQuery = {
      role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] },
      companyId: radheUser.companyId._id
    };

    console.log('\n📋 Sales persons query:', salesPersonQuery);

    const salesPersons = await User.find(salesPersonQuery)
      .populate('companyId', 'name city state location')
      .select('username fullName email role active createdAt companyId')
      .lean();

    console.log(`\n👥 Found ${salesPersons.length} sales persons from Akshaya Foods:`);
    salesPersons.forEach((sp, index) => {
      console.log(`${index + 1}. ${sp.username} (${sp.fullName || 'N/A'}) - Role: ${sp.role}`);
      console.log(`   Email: ${sp.email || 'N/A'}`);
      console.log(`   Active: ${sp.active !== false}`);
      console.log(`   Created: ${sp.createdAt}`);
      console.log(`   Company: ${sp.companyId?.name || 'N/A'}`);
      console.log('');
    });

    // Test the exact query the API would use
    const page = 1, limit = 10;
    const paginatedResults = await User.find(salesPersonQuery)
      .populate('companyId', 'name city state location')
      .select('username fullName email role active createdAt companyId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    console.log(`📄 Paginated results (page ${page}, limit ${limit}): ${paginatedResults.length} items`);
    
    const totalCount = await User.countDocuments(salesPersonQuery);
    console.log(`📊 Total count: ${totalCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📤 MongoDB connection closed');
  }
};

debugUnitHeadSalesPersons();