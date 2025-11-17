// Direct MongoDB operation to create sample returns

import mongoose from 'mongoose';

const createReturnsDirect = async () => {
  try {
    console.log('🔄 Creating returns directly in database...');
    
    // Connect using the same connection string as the server
    await mongoose.connect('mongodb+srv://techizeBuilder:u5M7WFlLNkIr0A4o@cluster0.by2xy6x.mongodb.net/bakery');
    console.log('✅ Connected to database');
    
    // Find a sales user to get companyId
    const User = mongoose.model('User');
    const salesUser = await User.findOne({ username: 'priyansh', role: 'Sales' });
    
    if (!salesUser) {
      console.log('❌ Sales user not found');
      return;
    }
    
    console.log('👤 Found user:', salesUser.username);
    console.log('🏢 Company ID:', salesUser.companyId);
    
    // Find a customer from same company
    const Customer = mongoose.model('Customer');
    const customer = await Customer.findOne({ companyId: salesUser.companyId });
    
    if (!customer) {
      console.log('❌ No customer found for this company');
      return;
    }
    
    console.log('🛒 Found customer:', customer.name);
    
    // Create sample return records directly
    const returnData = [
      {
        customerId: customer._id,
        customerName: customer.name || 'Sample Customer',
        returnDate: new Date(),
        reason: 'Product quality issue',
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productName: 'Fresh Bread Loaf',
          categoryName: 'Bakery',
          pricePerUnit: 45,
          quantity: 5,
          totalAmount: 225
        }],
        status: 'pending',
        type: 'refund',
        totalAmount: 225,
        totalQuantity: 5,
        notes: 'Customer reported stale product quality',
        createdBy: salesUser._id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        customerId: customer._id,
        customerName: customer.name || 'Sample Customer',
        returnDate: new Date(Date.now() - 86400000), // Yesterday
        reason: 'Transport damage',
        items: [{
          productId: new mongoose.Types.ObjectId(),
          productName: 'Chocolate Cake',
          categoryName: 'Desserts',
          pricePerUnit: 350,
          quantity: 1,
          totalAmount: 350
        }],
        status: 'approved',
        type: 'damage',
        totalAmount: 350,
        totalQuantity: 1,
        notes: 'Item damaged during transport',
        createdBy: salesUser._id,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000)
      }
    ];
    
    // Insert directly into returns collection
    const db = mongoose.connection.db;
    const result = await db.collection('returns').insertMany(returnData);
    
    console.log('✅ Created', result.insertedCount, 'return records');
    console.log('📋 Inserted IDs:', Object.values(result.insertedIds));
    
    console.log('\n🧪 Now test the API again: GET /api/sales/refund-return');
    console.log('🌐 Login as priyansh and check the refund/return data');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
};

createReturnsDirect();