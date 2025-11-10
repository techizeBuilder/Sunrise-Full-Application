import connectDB from './server/config/db.js';
import User from './server/models/User.js';

async function updateSalesPermissions() {
  try {
    await connectDB();
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
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateSalesPermissions();