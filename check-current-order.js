// Check current order data
import connectDB from './server/config/database.js';
import Order from './server/models/Order.js';

const checkOrder = async () => {
  try {
    await connectDB();
    console.log('🔍 Checking order...');
    
    const order = await Order.findById('69310803bc21db646ad64a7b');
    
    if (order) {
      console.log('📋 Current order:', {
        id: order._id,
        products: order.products?.length || 0,
        totalAmount: order.totalAmount,
        status: order.status
      });
      
      if (order.products && order.products.length > 0) {
        console.log('🛒 Current products:');
        order.products.forEach((p, i) => {
          console.log(`  ${i+1}. ProductID: ${p.product}, Qty: ${p.quantity}, Price: ${p.price || 0}`);
        });
      } else {
        console.log('⚠️ No products in order');
      }
    } else {
      console.log('❌ Order not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkOrder();