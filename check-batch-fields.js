import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';

async function checkBatchFields() {
  try {
    await mongoose.connect('mongodb://localhost:27017/inventory');
    console.log('Connected to MongoDB');
    
    // Find the specific item 'sdads' and show all its fields
    const item = await Item.findOne({ name: 'sdads' }).lean();
    console.log('\n=== SDADS ITEM COMPLETE DATA ===');
    if (item) {
      Object.keys(item).forEach(key => {
        console.log(`${key}: ${JSON.stringify(item[key])}`);
      });
    } else {
      console.log('Item not found');
    }
    
    // Check schema to see what batch-related fields exist
    console.log('\n=== BATCH-RELATED FIELDS ===');
    const schema = Item.schema;
    const paths = schema.paths;
    Object.keys(paths).forEach(field => {
      if (field.toLowerCase().includes('batch')) {
        console.log(`Batch field found: ${field} - ${paths[field].instance}`);
      }
    });
    
    // Show all field names for reference
    console.log('\n=== ALL AVAILABLE FIELDS ===');
    Object.keys(paths).forEach(field => {
      console.log(`${field}: ${paths[field].instance}`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBatchFields();