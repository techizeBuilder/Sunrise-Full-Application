import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    console.log('✅ Connected to MongoDB');
    console.log('🔍 Checking for duplicate ProductDailySummary entries...\n');
    
    // Find duplicates by productName and companyId
    const duplicates = await ProductDailySummary.aggregate([
      { 
        $group: { 
          _id: { productName: '$productName', companyId: '$companyId' },
          count: { $sum: 1 },
          docs: { $push: { 
            _id: '$_id', 
            date: '$date', 
            productId: '$productId',
            totalQuantity: '$totalQuantity',
            qtyPerBatch: '$qtyPerBatch'
          }}
        }
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log(`Found ${duplicates.length} duplicate product groups:\n`);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
    } else {
      duplicates.forEach((dup, i) => {
        console.log(`${i+1}. Product: "${dup._id.productName}" (${dup.count} entries)`);
        dup.docs.forEach((doc, j) => {
          const date = new Date(doc.date).toISOString().split('T')[0];
          console.log(`   ${j+1}. Date: ${date}, Qty: ${doc.totalQuantity || 0}, QtyPerBatch: ${doc.qtyPerBatch || 0}`);
        });
        console.log('');
      });
    }

    // Also check specific products you mentioned
    console.log('🎯 Checking specific products from your screenshot...\n');
    
    const specificProducts = [
      'Everyday Cream bun - Chocolate',
      'Everyday Cream bun - Strawberry'
    ];
    
    for (const productName of specificProducts) {
      const entries = await ProductDailySummary.find({ productName }).sort({ date: 1 });
      console.log(`"${productName}": ${entries.length} entries`);
      entries.forEach((entry, i) => {
        const date = new Date(entry.date).toISOString().split('T')[0];
        console.log(`  ${i+1}. Date: ${date}, ProductId: ${entry.productId}, Qty: ${entry.totalQuantity || 0}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDuplicates();