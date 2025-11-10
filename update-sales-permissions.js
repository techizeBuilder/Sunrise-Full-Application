import mongoose from 'mongoose';
import User from './server/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://erp:rMstPePBAKhXnEHd@cluster0.by2xy6x.mongodb.net/manufacturing-erp?retryWrites=true&w=majority';

async function updateSalesPermissions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      { role: 'Sales' },
      {
        $set: {
          'permissions.modules': [
            {
              name: 'sales',
              dashboard: true,
              features: [
                { key: 'salesDashboard', view: true, add: true, edit: true, delete: true, alter: true },
                { key: 'orders', view: true, add: true, edit: true, delete: true, alter: true },
                { key: 'myCustomers', view: true, add: true, edit: true, delete: true, alter: true },
                { key: 'myDeliveries', view: true, add: false, edit: false, delete: false, alter: false },
                { key: 'myInvoices', view: true, add: false, edit: false, delete: false, alter: false },
                { key: 'refundReturn', view: true, add: true, edit: true, delete: true, alter: true }
              ]
            },
            {
              name: 'inventory',
              dashboard: false,
              features: [
                { key: 'items', view: true, add: false, edit: false, delete: false, alter: false }
              ]
            }
          ]
        }
      }
    );

    console.log('Update result:', result);
    console.log('Sales users updated with inventory permissions');
    
    // Verify the update
    const salesUsers = await User.find({ role: 'Sales' });
    salesUsers.forEach(user => {
      console.log(`User ${user.username} permissions:`, JSON.stringify(user.permissions, null, 2));
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateSalesPermissions();