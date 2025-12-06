import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import { config } from 'dotenv';

// Load environment variables
config();

const findMainDuplicationCause = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 CORE ISSUE ANALYSIS: Why TWO entries in ProductDailySummary?\n');

    // Let's analyze one specific product that has duplicates
    const duplicateExample = await ProductDailySummary.find({
      productName: "Every Day Burger Buns 4\" - 200g",
      companyId: "6914090118cf85f80ad856bc"
    }).sort({ createdAt: 1 });

    console.log('📦 Analyzing: "Every Day Burger Buns 4" - 200g"');
    console.log(`Found ${duplicateExample.length} entries for this product:\n`);

    duplicateExample.forEach((entry, index) => {
      console.log(`Entry ${index + 1}:`);
      console.log(`  📅 Date Field: ${new Date(entry.date).toLocaleDateString()}`);
      console.log(`  🕐 Created At: ${new Date(entry.createdAt).toLocaleString()}`);
      console.log(`  🕐 Updated At: ${new Date(entry.updatedAt).toLocaleString()}`);
      console.log(`  🆔 Document ID: ${entry._id}`);
      console.log(`  📊 Total Quantity: ${entry.totalQuantity || 0}`);
      console.log(`  📦 QtyPerBatch: ${entry.qtyPerBatch || 0}`);
      console.log(`  🏭 Production Batches: ${entry.productionFinalBatches || 0}`);
      console.log(`  📈 Status: ${entry.status || 'N/A'}`);
      console.log(`  ---`);
    });

    // Now let's check the EXACT query logic being used in the codebase
    console.log('\n🔍 EXAMINING QUERY LOGIC IN CODEBASE:\n');

    // Test the queries that SHOULD prevent duplicates
    console.log('1. 🧪 Testing Inventory Controller Query (IGNORE DATE):');
    const inventoryQuery = await ProductDailySummary.findOne({
      productId: "6932ce3d50379a06f6a813ce",
      companyId: "6914090118cf85f80ad856bc"
    });
    console.log(`   Result: ${inventoryQuery ? 'FOUND EXISTING' : 'NOT FOUND'}`);
    if (inventoryQuery) {
      console.log(`   Date: ${new Date(inventoryQuery.date).toLocaleDateString()}`);
      console.log(`   Created: ${new Date(inventoryQuery.createdAt).toLocaleString()}`);
    }

    console.log('\n2. 🧪 Testing Production Service Query (WITH DATE):');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const productionQuery = await ProductDailySummary.findOne({
      date: today,
      companyId: new mongoose.Types.ObjectId("6914090118cf85f80ad856bc"),
      productId: new mongoose.Types.ObjectId("6932ce3d50379a06f6a813ce")
    });
    console.log(`   Query Date: ${today.toLocaleDateString()}`);
    console.log(`   Result: ${productionQuery ? 'FOUND EXISTING' : 'NOT FOUND'}`);
    if (productionQuery) {
      console.log(`   Date: ${new Date(productionQuery.date).toLocaleDateString()}`);
      console.log(`   Created: ${new Date(productionQuery.createdAt).toLocaleString()}`);
    }

    console.log('\n3. 🧪 Testing Sales Controller Query (IGNORE DATE):');
    const salesQuery = await ProductDailySummary.findOne({
      companyId: new mongoose.Types.ObjectId("6914090118cf85f80ad856bc"),
      productId: new mongoose.Types.ObjectId("6932ce3d50379a06f6a813ce")
    });
    console.log(`   Result: ${salesQuery ? 'FOUND EXISTING' : 'NOT FOUND'}`);
    if (salesQuery) {
      console.log(`   Date: ${new Date(salesQuery.date).toLocaleDateString()}`);
      console.log(`   Created: ${new Date(salesQuery.createdAt).toLocaleString()}`);
    }

    // KEY INSIGHT: Check if different controllers use different query patterns
    console.log('\n🎯 CORE ISSUE IDENTIFICATION:\n');

    const allEntries = await ProductDailySummary.find({
      productId: "6932ce3d50379a06f6a813ce",
      companyId: "6914090118cf85f80ad856bc"
    }).sort({ createdAt: 1 });

    console.log(`Total entries for this product: ${allEntries.length}`);
    console.log('Analysis:');
    
    if (allEntries.length > 1) {
      console.log('🚨 DUPLICATE CONFIRMED!');
      console.log('\nReasons for duplication:');
      
      // Check if dates are different
      const uniqueDates = [...new Set(allEntries.map(e => new Date(e.date).toLocaleDateString()))];
      console.log(`📅 Unique Dates: ${uniqueDates.length} (${uniqueDates.join(', ')})`);
      
      if (uniqueDates.length > 1) {
        console.log('❌ ROOT CAUSE: Different controllers creating entries for DIFFERENT DATES');
        console.log('   - Some controllers check WITH date (production service)');
        console.log('   - Some controllers check WITHOUT date (inventory/sales)');
        console.log('   - This creates date-based duplicates!');
      } else {
        console.log('❌ ROOT CAUSE: Controllers not properly checking for existing entries');
        console.log('   - Multiple controllers running simultaneously');
        console.log('   - Race condition or timing issues');
      }

      // Check creation timing
      const timeDiffs = [];
      for (let i = 1; i < allEntries.length; i++) {
        const diff = new Date(allEntries[i].createdAt) - new Date(allEntries[i-1].createdAt);
        timeDiffs.push(Math.round(diff / 1000 / 60)); // minutes
      }
      
      console.log(`\n⏰ Time gaps between creations: ${timeDiffs.join(', ')} minutes`);
      
      if (timeDiffs.some(diff => diff > 60)) {
        console.log('❌ ISSUE: Long time gaps indicate DIFFERENT USER SESSIONS/OPERATIONS');
      } else {
        console.log('❌ ISSUE: Short time gaps indicate SAME OPERATION CREATING MULTIPLE ENTRIES');
      }
    }

    // Check the actual database constraint
    console.log('\n🔍 DATABASE CONSTRAINT CHECK:\n');
    try {
      const indexes = await ProductDailySummary.collection.indexes();
      console.log('Existing indexes:');
      indexes.forEach(index => {
        console.log(`  - ${JSON.stringify(index.key)} (${index.unique ? 'UNIQUE' : 'NON-UNIQUE'})`);
      });
      
      const hasUniqueConstraint = indexes.some(index => 
        index.key.productId && index.key.companyId && index.unique
      );
      
      if (!hasUniqueConstraint) {
        console.log('❌ CRITICAL: No UNIQUE constraint on productId + companyId!');
        console.log('   This allows multiple entries for same product in same company!');
      } else {
        console.log('✅ Database has proper unique constraint');
      }
    } catch (err) {
      console.log('Error checking indexes:', err.message);
    }

  } catch (error) {
    console.error('❌ Error analyzing duplication cause:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the core analysis
findMainDuplicationCause();