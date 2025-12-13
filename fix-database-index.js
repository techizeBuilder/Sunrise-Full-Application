// Script to fix database index for batch-wise production entries
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixDatabaseIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('ungroupeditemproductions');

    console.log('\n🔍 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Drop the old problematic index
    try {
      console.log('\n🗑️ Dropping old index: companyId_1_itemId_1_productionDate_1...');
      await collection.dropIndex('companyId_1_itemId_1_productionDate_1');
      console.log('✅ Old index dropped successfully');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('📝 Old index not found, skipping drop');
      } else {
        console.log('⚠️ Error dropping old index:', error.message);
      }
    }

    // Drop any other similar index
    try {
      console.log('\n🗑️ Dropping old index: companyId_1_itemId_1_batchNumber_1_productionDate_1...');
      await collection.dropIndex('companyId_1_itemId_1_batchNumber_1_productionDate_1');
      console.log('✅ Old batchNumber index dropped successfully');
    } catch (error) {
      if (error.message.includes('index not found')) {
        console.log('📝 Old batchNumber index not found, skipping drop');
      } else {
        console.log('⚠️ Error dropping old batchNumber index:', error.message);
      }
    }

    // Create new index with batchNo field
    console.log('\n🔧 Creating new index: companyId_1_itemId_1_batchNo_1_productionDate_1...');
    await collection.createIndex(
      { companyId: 1, itemId: 1, batchNo: 1, productionDate: 1 }, 
      { unique: true, name: 'companyId_1_itemId_1_batchNo_1_productionDate_1' }
    );
    console.log('✅ New index created successfully');

    console.log('\n📋 Checking final indexes...');
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:', finalIndexes.map(idx => ({ name: idx.name, key: idx.key })));

    console.log('\n✅ Database index fix completed successfully!');
    console.log('📝 Now each batchNo (BATNO01, BATNO02, etc.) will create separate entries');

  } catch (error) {
    console.error('💥 Error fixing database index:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixDatabaseIndex();