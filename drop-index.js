import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manufacturing-erp';

async function dropIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('customers');
    
    // Drop the problematic index
    try {
      await collection.dropIndex('customerCode_1');
      console.log('Dropped customerCode_1 index');
    } catch (error) {
      console.log('Index may not exist:', error.message);
    }
    
    // Clear all customers
    await collection.deleteMany({});
    console.log('Cleared all customers');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Operation failed:', error);
    process.exit(1);
  }
}

dropIndex();