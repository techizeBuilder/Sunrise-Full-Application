// Quick test to check orders and seed test data if needed
import connectDB from './server/config/database.js';
import Order from './server/models/Order.js';
import Customer from './server/models/Customer.js';
import User from './server/models/User.js';

const checkAndSeedOrders = async () => {
  try {
    await connectDB();
    console.log('📊 Checking orders...');
    
    const orderCount = await Order.countDocuments();
    console.log(`Total orders in database: ${orderCount}`);
    
    if (orderCount === 0) {
      console.log('⚠️ No orders found. Creating sample orders...');
      
      // Find a sample customer and user
      const sampleCustomer = await Customer.findOne();
      const sampleUser = await User.findOne({ role: { $in: ['Sales', 'Unit Head', 'Admin'] } });
      
      if (!sampleCustomer || !sampleUser) {
        console.log('❌ Missing customer or user data. Cannot create sample orders.');
        process.exit(1);
      }
      
      // Create sample orders
      const sampleOrders = [
        {
          orderCode: 'ORD-001',
          customer: sampleCustomer._id,
          salesPerson: sampleUser._id,
          companyId: sampleUser.companyId,
          status: 'pending',
          totalAmount: 15000,
          orderDate: new Date(),
          products: [
            {
              product: null, // We'll need to find an item
              quantity: 10,
              price: 1500,
              total: 15000
            }
          ]
        },
        {
          orderCode: 'ORD-002',
          customer: sampleCustomer._id,
          salesPerson: sampleUser._id,
          companyId: sampleUser.companyId,
          status: 'approved',
          totalAmount: 25000,
          orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          products: [
            {
              product: null,
              quantity: 5,
              price: 5000,
              total: 25000
            }
          ]
        },
        {
          orderCode: 'ORD-003',
          customer: sampleCustomer._id,
          salesPerson: sampleUser._id,
          companyId: sampleUser.companyId,
          status: 'delivered',
          totalAmount: 8000,
          orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          products: [
            {
              product: null,
              quantity: 2,
              price: 4000,
              total: 8000
            }
          ]
        }
      ];
      
      const createdOrders = await Order.insertMany(sampleOrders);
      console.log(`✅ Created ${createdOrders.length} sample orders`);
    }
    
    // Show current orders
    const orders = await Order.find()
      .populate('customer', 'name')
      .populate('salesPerson', 'username fullName')
      .limit(5)
      .sort({ createdAt: -1 })
      .lean();
      
    console.log('\n📋 Recent orders:');
    orders.forEach(order => {
      console.log(`- ${order.orderCode || 'No code'}: ${order.customer?.name || 'No customer'} - ${order.status} - ₹${order.totalAmount || 0}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkAndSeedOrders();