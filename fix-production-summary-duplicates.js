import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import { config } from 'dotenv';

// Load environment variables
config();

const fixProductDailySummaryDuplicates = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔧 FIXING PRODUCTDAILYSUMMARY DUPLICATES...\n');

    // 1. First, drop the old unique index
    console.log('🗑️ Dropping old unique index (date + company + product)...');
    try {
      await ProductDailySummary.collection.dropIndex({ date: 1, companyId: 1, productId: 1 });
      console.log('✅ Old index dropped successfully');
    } catch (err) {
      console.log('ℹ️ Old index might not exist or already dropped');
    }

    // 2. Find and resolve duplicates
    console.log('\n🔍 Finding duplicates to resolve...');
    
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
              qtyPerBatch: "$$ROOT.qtyPerBatch",
              totalQuantity: "$$ROOT.totalQuantity",
              productionFinalBatches: "$$ROOT.productionFinalBatches",
              packing: "$$ROOT.packing",
              physicalStock: "$$ROOT.physicalStock",
              batchAdjusted: "$$ROOT.batchAdjusted",
              status: "$$ROOT.status"
            }
          }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`Found ${duplicates.length} sets of duplicates to resolve`);

    let resolvedCount = 0;
    let removedCount = 0;

    // 3. For each duplicate set, keep the most recent/relevant one and remove others
    for (const duplicate of duplicates) {
      console.log(`\n📦 Resolving: Product ${duplicate._id.productId} in Company ${duplicate._id.companyId}`);
      console.log(`   Found ${duplicate.count} duplicates`);

      // Sort by priority: latest updatedAt, then highest values
      const sortedDocs = duplicate.documents.sort((a, b) => {
        // Primary: Most recently updated
        if (new Date(b.updatedAt) !== new Date(a.updatedAt)) {
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        }
        // Secondary: Highest production values
        const aValue = (a.productionFinalBatches || 0) + (a.totalQuantity || 0) + (a.qtyPerBatch || 0);
        const bValue = (b.productionFinalBatches || 0) + (b.totalQuantity || 0) + (b.qtyPerBatch || 0);
        return bValue - aValue;
      });

      // Keep the first (best) document, remove the rest
      const keepDoc = sortedDocs[0];
      const removeIds = sortedDocs.slice(1).map(doc => doc.docId);

      console.log(`   ✅ Keeping: ${keepDoc.docId} (Updated: ${new Date(keepDoc.updatedAt).toLocaleString()})`);
      console.log(`   🗑️ Removing: ${removeIds.length} duplicates`);

      // Update the kept document with the latest date
      await ProductDailySummary.findByIdAndUpdate(keepDoc.docId, {
        date: new Date(), // Set to current date
        updatedAt: new Date()
      });

      // Remove duplicate documents
      if (removeIds.length > 0) {
        await ProductDailySummary.deleteMany({ _id: { $in: removeIds } });
        removedCount += removeIds.length;
      }

      resolvedCount++;
    }

    console.log(`\n📊 Resolution Summary:`);
    console.log(`   - Resolved ${resolvedCount} duplicate sets`);
    console.log(`   - Removed ${removedCount} duplicate documents`);

    // 4. Create the new correct unique index
    console.log('\n🔧 Creating new unique index (product + company only)...');
    try {
      await ProductDailySummary.collection.createIndex(
        { productId: 1, companyId: 1 }, 
        { unique: true, name: 'productId_companyId_unique' }
      );
      console.log('✅ New unique index created successfully');
    } catch (err) {
      console.log('⚠️ Index creation failed:', err.message);
      if (err.message.includes('duplicate key')) {
        console.log('❌ Still have duplicates! Manual intervention needed.');
      }
    }

    // 5. Verify no duplicates remain
    console.log('\n🔍 Verifying fix...');
    const remainingDuplicates = await ProductDailySummary.aggregate([
      {
        $group: {
          _id: {
            productId: "$productId",
            companyId: "$companyId"
          },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (remainingDuplicates.length === 0) {
      console.log('✅ SUCCESS! No duplicates remain. Each product has only ONE entry per company.');
    } else {
      console.log(`❌ Still ${remainingDuplicates.length} duplicate sets remain. Check manually.`);
    }

    // 6. Show final count
    const totalEntries = await ProductDailySummary.countDocuments();
    console.log(`\n📊 Final database state: ${totalEntries} total ProductDailySummary entries`);

  } catch (error) {
    console.error('❌ Error fixing duplicates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the fix
fixProductDailySummaryDuplicates();