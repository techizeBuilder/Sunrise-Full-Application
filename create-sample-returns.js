// Create sample refund/return data for testing

import mongoose from 'mongoose';
import Return from './server/models/Return.js';
import Order from './server/models/Order.js';
import Customer from './server/models/Customer.js';
import User from './server/models/User.js';
import { Item } from './server/models/Inventory.js';

const createSampleRefundReturns = async () => {
  try {
    console.log('🔄 Creating sample refund/return data...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://techizeBuilder:u5M7WFlLNkIr0A4o@cluster0.by2xy6x.mongodb.net/bakery');
    console.log('✅ Connected to database');
    
    // Get a sample sales user
    const salesUser = await User.findOne({ username: 'priyansh', role: 'Sales' });
    if (!salesUser) {
      console.log('❌ Sales user not found');
      return;
    }
    
    console.log('👤 Found sales user:', salesUser.username);
    console.log('🏢 Company ID:', salesUser.companyId);
    
    // Find a customer from same company
    const customer = await Customer.findOne({ companyId: salesUser.companyId });
    if (!customer) {
      console.log('❌ No customers found for this company');
      return;
    }
    
    // Find some items to use in returns
    const items = await Item.find({ store: salesUser.companyId }).limit(3);
    
    // Create first return record
    const returnData1 = {
      customerId: customer._id,
      customerName: customer.name || 'Sample Customer',
      returnDate: new Date(),
      reason: 'Product quality issue reported by customer',
      items: items.length > 0 ? [
        {
          productId: items[0]._id,
          productName: items[0].name,
          categoryName: items[0].category,
          pricePerUnit: items[0].stdCost || 50,
          quantity: 2,
          totalAmount: (items[0].stdCost || 50) * 2
        }
      ] : [
        {
          productId: new mongoose.Types.ObjectId(),
          productName: 'Fresh Bread Loaf',
          categoryName: 'Bakery',
          pricePerUnit: 45,
          quantity: 5,
          totalAmount: 225
        }
      ],
      status: 'pending',
      type: 'refund',
      totalAmount: 0, // Will be calculated by pre-save middleware
      totalQuantity: 0, // Will be calculated by pre-save middleware
      notes: 'Customer reported stale product quality',
      createdBy: salesUser._id
    };
    
    const return1 = await Return.create(returnData1);
    console.log('✅ Created return 1:', return1._id);
    
    // Create second return record
    const returnData2 = {
      customerId: customer._id,
      customerName: customer.name || 'Sample Customer',
      returnDate: new Date(Date.now() - 86400000), // Yesterday
      reason: 'Transport damage during delivery',
      items: items.length > 1 ? [
        {
          productId: items[1]._id,
          productName: items[1].name,
          categoryName: items[1].category,
          pricePerUnit: items[1].stdCost || 100,
          quantity: 1,
          totalAmount: items[1].stdCost || 100
        }
      ] : [
        {
          productId: new mongoose.Types.ObjectId(),
          productName: 'Chocolate Cake',
          categoryName: 'Desserts',
          pricePerUnit: 350,
          quantity: 1,
          totalAmount: 350
        }
      ],
      status: 'approved',
      type: 'damage',
      totalAmount: 0, // Will be calculated by pre-save middleware
      totalQuantity: 0, // Will be calculated by pre-save middleware
      notes: 'Item was damaged during transport to customer location',
      createdBy: salesUser._id
    };
    
    const return2 = await Return.create(returnData2);
    console.log('✅ Created return 2:', return2._id);
    
    console.log('\n✅ Sample refund/return data creation completed!');
    console.log('📊 Total returns created: 2');
    console.log('🧪 Now test the API: GET /api/sales/refund-return');
    console.log('🌐 Login as priyansh and check RefundDamage page');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the script
createSampleRefundReturns();

createSampleRefundReturns();