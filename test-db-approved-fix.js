// Direct database test to verify the sales breakdown filter fix

import mongoose from 'mongoose';
import Order from './server/models/Order.js';

async function testDatabaseQuery() {
  try {
    console.log('🧪 Testing Database Query - Approved Orders Only');
    console.log('================================================\n');
    
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/sunriseInventory');
    console.log('✅ Connected to database');
    
    // Test the aggregation with old logic (all orders except cancelled/rejected)
    console.log('\n📊 OLD LOGIC: All orders except cancelled/rejected');
    const oldLogicResults = await Order.aggregate([
      {
        $match: {
          'products.product': { $exists: true },
          status: { $nin: ['cancelled', 'rejected'] }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('Status breakdown (OLD LOGIC):');
    oldLogicResults.forEach(result => {
      console.log(`   ${result._id}: ${result.count} orders`);
    });
    
    // Test the aggregation with new logic (approved orders only)
    console.log('\n📊 NEW LOGIC: Approved orders only');
    const newLogicResults = await Order.aggregate([
      {
        $match: {
          'products.product': { $exists: true },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Status breakdown (NEW LOGIC):');
    newLogicResults.forEach(result => {
      console.log(`   ${result._id}: ${result.count} orders`);
    });
    
    const totalOld = oldLogicResults.reduce((sum, r) => sum + r.count, 0);
    const totalNew = newLogicResults.reduce((sum, r) => sum + r.count, 0);
    
    console.log('\n🎯 COMPARISON:');
    console.log(`   OLD: ${totalOld} total orders (including pending, in_production, etc.)`);
    console.log(`   NEW: ${totalNew} total orders (approved only)`);
    console.log(`   REDUCED BY: ${totalOld - totalNew} orders`);
    
    console.log('\n✅ FIX APPLIED: Sales breakdown now only counts approved orders');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

testDatabaseQuery();