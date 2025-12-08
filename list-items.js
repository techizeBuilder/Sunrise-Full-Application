import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function listAllItems() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    const items = await Item.find({ store: "6914090118cf85f80ad856bc" })
      .select('name category code')
      .sort({ name: 1 });
    
    console.log(`\nFound ${items.length} items in store 6914090118cf85f80ad856bc:`);
    items.forEach((item, index) => {
      console.log(`${index + 1}. "${item.name}" - Category: ${item.category} - Code: ${item.code}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listAllItems();