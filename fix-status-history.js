// Script to check and fix statusHistory updatedBy issues

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/manuERP', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const orderSchema = new mongoose.Schema({
  statusHistory: [{
    status: String,
    updatedBy: mongoose.Schema.Types.ObjectId,
    updatedAt: Date,
    remarks: String,
    notes: String,
    previousStatus: String
  }]
}, { strict: false });

const Order = mongoose.model('Order', orderSchema);

const fixStatusHistoryIssues = async () => {
  try {
    console.log('🔍 Checking for orders with invalid statusHistory...');
    
    // Find orders with statusHistory entries missing updatedBy
    const ordersWithIssues = await Order.find({
      'statusHistory.updatedBy': { $exists: false }
    }).select('_id orderCode statusHistory');
    
    console.log(`Found ${ordersWithIssues.length} orders with statusHistory issues`);
    
    if (ordersWithIssues.length > 0) {
      console.log('🔧 Fixing statusHistory entries...');
      
      for (let order of ordersWithIssues) {
        console.log(`Fixing order: ${order.orderCode} (${order._id})`);
        
        // Fix each statusHistory entry
        for (let i = 0; i < order.statusHistory.length; i++) {
          if (!order.statusHistory[i].updatedBy) {
            // Set a default updatedBy - you can change this to a specific user ID
            order.statusHistory[i].updatedBy = new mongoose.Types.ObjectId('000000000000000000000000'); // Placeholder
            order.statusHistory[i].notes = order.statusHistory[i].notes || 'Legacy entry - updatedBy unknown';
          }
        }
        
        // Save the order with fixed statusHistory
        await Order.updateOne(
          { _id: order._id },
          { $set: { statusHistory: order.statusHistory } }
        );
      }
      
      console.log('✅ All statusHistory entries fixed');
    } else {
      console.log('✅ No statusHistory issues found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing statusHistory:', error);
  } finally {
    mongoose.connection.close();
  }
};

fixStatusHistoryIssues();