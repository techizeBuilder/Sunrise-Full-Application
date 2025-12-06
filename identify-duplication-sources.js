import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import { config } from 'dotenv';

// Load environment variables
config();

const identifyDuplicationSources = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 ANALYZING DUPLICATE CREATION PATTERNS...\n');

    // Get the duplicates with creation timestamps
    const duplicates = await ProductDailySummary.aggregate([
      {
        $group: {
          _id: {
            productId: "$productId",
            companyId: "$companyId"
          },
          count: { $sum: 1 },
          documents: { 
            $push: {
              docId: "$$ROOT._id",
              productName: "$$ROOT.productName",
              date: "$$ROOT.date",
              createdAt: "$$ROOT.createdAt",
              updatedAt: "$$ROOT.updatedAt",
              totalQuantity: "$$ROOT.totalQuantity",
              qtyPerBatch: "$$ROOT.qtyPerBatch"
            }
          }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log(`🔍 Found ${duplicates.length} duplicate sets. Analyzing creation patterns:\n`);

    for (let i = 0; i < Math.min(duplicates.length, 5); i++) {
      const duplicate = duplicates[i];
      console.log(`${i + 1}. Product: ${duplicate.documents[0].productName}`);
      console.log(`   Product ID: ${duplicate._id.productId}`);
      console.log(`   Company ID: ${duplicate._id.companyId}`);
      console.log(`   Duplicate Count: ${duplicate.count}`);
      
      // Sort documents by creation time to see the pattern
      const sortedDocs = duplicate.documents.sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      console.log(`   Creation Timeline:`);
      sortedDocs.forEach((doc, index) => {
        const createdTime = new Date(doc.createdAt);
        const updatedTime = new Date(doc.updatedAt);
        const timeDiff = Math.abs(updatedTime - createdTime);
        const isUpdated = timeDiff > 1000; // More than 1 second difference
        
        console.log(`     ${index + 1}) Created: ${createdTime.toLocaleString()}`);
        console.log(`        Date Field: ${new Date(doc.date).toLocaleDateString()}`);
        console.log(`        Updated: ${updatedTime.toLocaleString()} ${isUpdated ? '(UPDATED)' : '(NOT UPDATED)'}`);
        console.log(`        Quantity: ${doc.totalQuantity || 0}, QtyPerBatch: ${doc.qtyPerBatch || 0}`);
        console.log(`        Doc ID: ${doc.docId}`);
        console.log(`        ---`);
      });
      console.log(`\n`);
    }

    // Check creation patterns by hour to identify peak creation times
    console.log('\n📊 CREATION PATTERN ANALYSIS:\n');
    
    const creationPatterns = await ProductDailySummary.aggregate([
      {
        $project: {
          hour: { $hour: "$createdAt" },
          date: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$createdAt" 
            } 
          },
          productId: 1,
          companyId: 1,
          productName: 1
        }
      },
      {
        $group: {
          _id: {
            date: "$date",
            hour: "$hour"
          },
          count: { $sum: 1 },
          uniqueProducts: { $addToSet: { productId: "$productId", companyId: "$companyId" } }
        }
      },
      {
        $sort: { "_id.date": -1, "_id.hour": 1 }
      }
    ]);

    console.log('Creation patterns by date and hour:');
    creationPatterns.forEach(pattern => {
      const uniqueProductCount = pattern.uniqueProducts.length;
      const duplicateRatio = pattern.count / uniqueProductCount;
      
      console.log(`📅 ${pattern._id.date} at ${pattern._id.hour}:00 - ${pattern.count} entries, ${uniqueProductCount} unique products (${duplicateRatio.toFixed(2)}x duplication ratio)`);
      
      if (duplicateRatio > 1.5) {
        console.log(`   🚨 HIGH DUPLICATION DETECTED!`);
      }
    });

    // Check for specific duplicate products that appear on both Dec 5 and Dec 6
    console.log('\n🗓️ CROSS-DATE ANALYSIS:\n');
    
    const crossDateDuplicates = await ProductDailySummary.aggregate([
      {
        $project: {
          productId: 1,
          companyId: 1,
          productName: 1,
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          createdAt: 1,
          totalQuantity: 1
        }
      },
      {
        $group: {
          _id: {
            productId: "$productId",
            companyId: "$companyId"
          },
          dates: { $addToSet: "$date" },
          entries: { $push: "$$ROOT" }
        }
      },
      {
        $match: {
          "dates.1": { $exists: true } // Has entries on multiple dates
        }
      }
    ]);

    console.log(`Found ${crossDateDuplicates.length} products with entries on multiple dates:`);
    crossDateDuplicates.slice(0, 3).forEach(product => {
      console.log(`📦 Product: ${product.entries[0].productName}`);
      console.log(`   Dates: ${product.dates.join(', ')}`);
      console.log(`   Total Entries: ${product.entries.length}`);
      product.entries.forEach(entry => {
        console.log(`     - ${entry.date}: Qty ${entry.totalQuantity || 0} (Created: ${new Date(entry.createdAt).toLocaleString()})`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error analyzing duplicates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the analysis
identifyDuplicationSources();