// Simple script to fix the database index issue
import mongoose from 'mongoose';
import UngroupedItemProduction from './server/models/UngroupedItemProduction.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixIndexIssue() {
  try {
    console.log('🔌 Connecting to fix index issue...');
    
    // Connect with direct URI
    const mongoUri = 'mongodb://localhost:27017/manuerp';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get the collection directly
    const collection = mongoose.connection.db.collection('ungroupeditemproductions');

    // Check existing indexes
    console.log('\n🔍 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop problematic index
    console.log('\n🗑️ Dropping problematic index...');
    try {
      await collection.dropIndex('companyId_1_itemId_1_productionDate_1');
      console.log('✅ Dropped old index');
    } catch (err) {
      console.log('📝 Index already dropped or not found:', err.message);
    }

    // Create new correct index
    console.log('\n🔧 Creating new index...');
    await collection.createIndex(
      { companyId: 1, itemId: 1, batchNo: 1, productionDate: 1 }, 
      { unique: true }
    );
    console.log('✅ Created new index with batchNo field');

    console.log('\n📋 Updated indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    await mongoose.connection.close();
    console.log('\n🎉 Index fixed! Now you can create separate entries for each batch number.');

  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

fixIndexIssue();