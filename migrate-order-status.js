import mongoose from 'mongoose';
import Order from './server/models/Order.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected for migration...');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Migration to update status values from uppercase to lowercase
const migrateOrderStatus = async () => {
  try {
    console.log('Starting order status migration...');
    
    // Mapping of old to new status values
    const statusMapping = {
      'Pending': 'pending',
      'Approved': 'approved', 
      'Disapproved': 'rejected',
      'In_Production': 'in_production',
      'Completed': 'completed',
      'Cancelled': 'cancelled'
    };

    // Find all orders with old status values
    const ordersToUpdate = await Order.find({
      status: { $in: Object.keys(statusMapping) }
    });

    console.log(`Found ${ordersToUpdate.length} orders to migrate`);

    if (ordersToUpdate.length === 0) {
      console.log('No orders need migration');
      return;
    }

    // Update each order
    for (const order of ordersToUpdate) {
      const newStatus = statusMapping[order.status];
      if (newStatus) {
        console.log(`Updating order ${order.orderCode} from ${order.status} to ${newStatus}`);
        
        // Use updateOne with validation disabled to avoid enum conflicts
        await Order.updateOne(
          { _id: order._id },
          { 
            $set: { status: newStatus },
            $push: {
              statusHistory: {
                status: newStatus,
                updatedBy: order.salesPerson || order.approvedBy,
                updatedAt: new Date(),
                remarks: 'Status migrated to lowercase format'
              }
            }
          },
          { runValidators: false } // Disable validation during migration
        );
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateOrderStatus();
  await mongoose.disconnect();
  console.log('Migration script finished');
  process.exit(0);
};

runMigration();