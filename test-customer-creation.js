// Test script to verify customer creation and filtering for sales users
import mongoose from 'mongoose';
import Customer from './server/models/Customer.js';
import User from './server/models/User.js';
import { Company } from './server/models/Company.js';

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function testCustomerCreationAndFiltering() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a sales user to test with
    const salesUser = await User.findOne({ role: 'Sales' });
    if (!salesUser) {
      console.log('❌ No sales user found. Creating a test sales user...');
      
      // Create a test sales user
      const company = await Company.findOne();
      if (!company) {
        console.log('❌ No company found. Cannot proceed.');
        return;
      }

      const newSalesUser = new User({
        username: 'testsales',
        email: 'testsales@test.com',
        password: '$2a$10$hash', // Just a placeholder
        role: 'Sales',
        companyId: company._id
      });
      
      await newSalesUser.save();
      console.log('✅ Created test sales user:', newSalesUser.username);
      console.log('   Company:', company.name);
      console.log('   User ID:', newSalesUser._id);
    } else {
      console.log('✅ Found existing sales user:', salesUser.username);
      console.log('   Company ID:', salesUser.companyId);
      console.log('   User ID:', salesUser._id);
    }

    const testSalesUser = salesUser || await User.findOne({ username: 'testsales' });

    // Test 1: Create a new customer with sales user context
    console.log('\n📝 Testing customer creation...');
    
    const testCustomerData = {
      name: 'Test Customer Created by Sales',
      contactPerson: 'John Doe',
      mobile: '9876543210',
      email: 'testcustomer@example.com',
      category: 'Retailer',
      // Simulate what the controller does - assign companyId and salesContact
      companyId: testSalesUser.companyId,
      salesContact: testSalesUser._id
    };

    const newCustomer = new Customer(testCustomerData);
    await newCustomer.save();
    
    console.log('✅ Customer created successfully:');
    console.log('   Name:', newCustomer.name);
    console.log('   Company ID:', newCustomer.companyId);
    console.log('   Sales Contact:', newCustomer.salesContact);

    // Test 2: Query customers for this sales user (simulating the filtering logic)
    console.log('\n🔍 Testing customer filtering for sales user...');
    
    const salesUserQuery = {
      $and: [
        { companyId: testSalesUser.companyId }, // Company isolation
        { salesContact: testSalesUser._id }     // Assigned customers only
      ]
    };

    const assignedCustomers = await Customer.find(salesUserQuery)
      .populate('salesContact', 'username email')
      .populate('companyId', 'name');

    console.log(`✅ Found ${assignedCustomers.length} customers assigned to ${testSalesUser.username}:`);
    assignedCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.name}`);
      console.log(`      Company: ${customer.companyId?.name || 'N/A'}`);
      console.log(`      Sales Contact: ${customer.salesContact?.username || 'N/A'}`);
    });

    // Test 3: Test company-wide filtering (what Unit Managers would see)
    console.log('\n🏢 Testing company-wide customer filtering...');
    
    const companyCustomers = await Customer.find({ companyId: testSalesUser.companyId })
      .populate('salesContact', 'username email')
      .populate('companyId', 'name');

    console.log(`✅ Found ${companyCustomers.length} total customers in company:`);
    companyCustomers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.name}`);
      console.log(`      Sales Contact: ${customer.salesContact?.username || 'Unassigned'}`);
    });

    // Test 4: Check if there are customers without salesContact
    const unassignedCustomers = await Customer.find({
      companyId: testSalesUser.companyId,
      $or: [
        { salesContact: null },
        { salesContact: { $exists: false } }
      ]
    });

    console.log(`\n📋 Found ${unassignedCustomers.length} unassigned customers in company`);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testCustomerCreationAndFiltering();