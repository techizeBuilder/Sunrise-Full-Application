// Debug script to check existing items and duplicate prevention
import mongoose from 'mongoose';
import { Item } from './server/models/Inventory.js';

// Test the duplicate prevention logic
async function debugDuplicatePrevention() {
  try {
    // Connect to MongoDB using the same URI as the main app
    const mongoURI = 'mongodb+srv://jeeturadicalloop:Mjvesqnj8gY3t0zP@cluster0.by2xy6x.mongodb.net/manuerp';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB');
    
    // Search for items with similar names
    console.log('\n🔍 Searching for items similar to "PIZAA"...');
    
    const similarItems = await Item.find({
      name: { $regex: /pizza|piza|pizaa/i }
    }).select('name code companyId createdAt');
    
    console.log('Found similar items:');
    if (similarItems.length === 0) {
      console.log('No similar items found.');
    } else {
      similarItems.forEach(item => {
        console.log(`- "${item.name}" (Code: ${item.code}) Company: ${item.companyId || 'NO_COMPANY'} Created: ${item.createdAt}`);
      });
    }
    
    // Test the exact regex that should be used
    const testName = 'PIZAA';
    const escapedName = testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const testRegex = new RegExp(`^${escapedName}$`, 'i');
    
    console.log('\n🧪 Testing regex pattern:');
    console.log('Test name:', testName);
    console.log('Escaped name:', escapedName);
    console.log('Regex pattern:', testRegex);
    
    const exactMatches = await Item.find({
      name: { $regex: testRegex }
    }).select('name code companyId');
    
    console.log('Exact regex matches:');
    if (exactMatches.length === 0) {
      console.log('No exact matches found.');
    } else {
      exactMatches.forEach(item => {
        console.log(`- "${item.name}" (Code: ${item.code}) Company: ${item.companyId || 'NO_COMPANY'}`);
      });
    }
    
    // Check all items without company filter
    console.log('\n📊 Database Statistics:');
    console.log('Total items count:', await Item.countDocuments());
    console.log('Items with companyId:', await Item.countDocuments({ companyId: { $exists: true, $ne: null } }));
    console.log('Items without companyId:', await Item.countDocuments({ companyId: { $exists: false } }));
    console.log('Items with null companyId:', await Item.countDocuments({ companyId: null }));
    
    // Check recent items
    const recentItems = await Item.find().sort({ createdAt: -1 }).limit(5).select('name code companyId createdAt store');
    console.log('\n📅 Recent 5 items:');
    recentItems.forEach(item => {
      const companyInfo = item.companyId || 'NO_COMPANY';
      const storeInfo = item.store || 'NO_STORE';
      console.log(`- "${item.name}" (Code: ${item.code}) Company: ${companyInfo} Store: ${storeInfo} Created: ${new Date(item.createdAt).toLocaleString()}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    await mongoose.disconnect();
  }
}

debugDuplicatePrevention();