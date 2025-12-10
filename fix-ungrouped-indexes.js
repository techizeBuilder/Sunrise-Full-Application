/**
 * Migration script to fix the UngroupedItemProduction index
 * Run this to drop the old index and ensure the new batch-aware index is working
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import UngroupedItemProduction from './server/models/UngroupedItemProduction.js';

// Load environment variables
dotenv.config();

async function fixIndexes() {
  try {
    console.log('🔧 Starting index migration for UngroupedItemProduction...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/manufacturing-erp');
    console.log('✅ Connected to database');
    
    // Get the collection
    const collection = mongoose.connection.db.collection('ungroupeditemproductions');
    
    // List existing indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach(index => {
      console.log('  -', index.name, ':', JSON.stringify(index.key));
    });
    
    // Drop the old index if it exists
    try {
      await collection.dropIndex('companyId_1_itemId_1_productionDate_1');
      console.log('🗑️ Dropped old index: companyId_1_itemId_1_productionDate_1');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('ℹ️ Old index not found (already dropped)');
      } else {
        console.log('⚠️ Error dropping old index:', error.message);
      }
    }
    
    // Ensure the new index exists
    try {
      await collection.createIndex(
        { companyId: 1, itemId: 1, batchNumber: 1, productionDate: 1 },
        { unique: true, name: 'companyId_1_itemId_1_batchNumber_1_productionDate_1' }
      );
      console.log('✅ Created new index: companyId_1_itemId_1_batchNumber_1_productionDate_1');
    } catch (error) {
      if (error.code === 85) { // IndexOptionsConflict
        console.log('ℹ️ New index already exists');
      } else {
        console.log('⚠️ Error creating new index:', error.message);
      }
    }
    
    // List final indexes
    const finalIndexes = await collection.indexes();
    console.log('📋 Final indexes:');
    finalIndexes.forEach(index => {
      console.log('  -', index.name, ':', JSON.stringify(index.key));
    });
    
    console.log('✅ Index migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixIndexes().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default fixIndexes;