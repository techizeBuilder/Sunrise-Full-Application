import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import dotenv from 'dotenv';

dotenv.config();

async function removeDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');
    console.log('🧹 Removing duplicate ProductDailySummary entries...\n');
    
    // Find all duplicate groups
    const duplicates = await ProductDailySummary.aggregate([
      { 
        $group: { 
          _id: { productName: '$productName', companyId: '$companyId' },
          count: { $sum: 1 },
          docs: { $push: { 
            _id: '$_id', 
            date: '$date',
            createdAt: '$createdAt'
          }}
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    console.log(`Found ${duplicates.length} groups with duplicates`);
    
    let totalRemoved = 0;
    
    for (const dup of duplicates) {
      console.log(`\n📦 Processing: "${dup._id.productName}" (${dup.count} entries)`);
      
      // Sort by createdAt to keep the oldest (first created)
      dup.docs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Keep the first one, remove the rest
      const toKeep = dup.docs[0];
      const toRemove = dup.docs.slice(1);
      
      console.log(`   ✅ Keeping: ${new Date(toKeep.date).toISOString().split('T')[0]} (created: ${new Date(toKeep.createdAt).toISOString().split('T')[0]})`);
      
      for (const remove of toRemove) {
        await ProductDailySummary.deleteOne({ _id: remove._id });
        console.log(`   🗑️  Removed: ${new Date(remove.date).toISOString().split('T')[0]} (created: ${new Date(remove.createdAt).toISOString().split('T')[0]})`);
        totalRemoved++;
      }
    }
    
    console.log(`\n🎉 Cleanup complete! Removed ${totalRemoved} duplicate entries.`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

removeDuplicates();