import mongoose from 'mongoose';
import Order from './server/models/Order.js';
import User from './server/models/User.js';

const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function updateOrdersSalesPerson() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all sales persons from users table
    const salesPersons = await User.find({
      role: { $in: ['Sales', 'sales', 'SalesPerson'] }
    }).select('_id username role');

    if (salesPersons.length === 0) {
      console.log('No sales persons found in the database');
      return;
    }

    console.log(`Found ${salesPersons.length} sales persons:`);
    salesPersons.forEach(sp => {
      console.log(`- ${sp.username} (${sp._id}) - Role: ${sp.role}`);
    });

    // Find orders without salesPerson assigned
    const ordersWithoutSalesPerson = await Order.find({
      $or: [
        { salesPerson: null },
        { salesPerson: undefined },
        { salesPerson: { $exists: false } }
      ]
    });

    console.log(`\nFound ${ordersWithoutSalesPerson.length} orders without salesPerson assigned`);

    if (ordersWithoutSalesPerson.length === 0) {
      console.log('All orders already have salesPerson assigned!');
      return;
    }

    // Update each order with a random salesPerson
    let updatedCount = 0;
    for (const order of ordersWithoutSalesPerson) {
      // Get random sales person
      const randomIndex = Math.floor(Math.random() * salesPersons.length);
      const randomSalesPerson = salesPersons[randomIndex];

      await Order.findByIdAndUpdate(order._id, {
        salesPerson: randomSalesPerson._id
      });

      console.log(`Updated order ${order.orderCode || order._id} - assigned to ${randomSalesPerson.username}`);
      updatedCount++;
    }

    console.log(`\n✅ Successfully updated ${updatedCount} orders with random salesPerson assignments`);

    // Verify the updates
    const remainingOrders = await Order.find({
      $or: [
        { salesPerson: null },
        { salesPerson: undefined },
        { salesPerson: { $exists: false } }
      ]
    });

    console.log(`\n📊 Verification: ${remainingOrders.length} orders still without salesPerson`);

    // Show summary of assignments
    const ordersBySalesPerson = await Order.aggregate([
      {
        $match: {
          salesPerson: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$salesPerson',
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'salesPersonInfo'
        }
      },
      {
        $project: {
          salesPersonId: '$_id',
          orderCount: 1,
          username: { $arrayElemAt: ['$salesPersonInfo.username', 0] }
        }
      }
    ]);

    console.log('\n📈 Orders by SalesPerson:');
    ordersBySalesPerson.forEach(sp => {
      console.log(`- ${sp.username || 'Unknown'} (${sp.salesPersonId}): ${sp.orderCount} orders`);
    });

  } catch (error) {
    console.error('Error updating orders:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the script
updateOrdersSalesPerson();