import mongoose from 'mongoose';
import ProductDailySummary from './server/models/ProductDailySummary.js';
import { config } from 'dotenv';

// Load environment variables
config();

const checkDuplicateProductSummaries = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Checking for duplicate entries in ProductDailySummary...\n');

    // Find duplicates by productId and companyId combination
    const duplicates = await ProductDailySummary.aggregate([
      {
        $group: {
          _id: {
            productId: "$productId",
            companyId: "$companyId"
          },
          count: { $sum: 1 },
          documents: { $push: "$$ROOT" }
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

    if (duplicates.length === 0) {
      console.log('✅ No duplicate entries found! Each product-company combination is unique.');
    } else {
      console.log(`❌ Found ${duplicates.length} sets of duplicate entries:\n`);
      
      for (let i = 0; i < duplicates.length; i++) {
        const duplicate = duplicates[i];
        console.log(`${i + 1}. Product ID: ${duplicate._id.productId}`);
        console.log(`   Company ID: ${duplicate._id.companyId}`);
        console.log(`   Duplicate Count: ${duplicate.count} entries`);
        console.log(`   Document IDs:`);
        
        duplicate.documents.forEach((doc, index) => {
          console.log(`     ${index + 1}) ${doc._id} - Date: ${doc.date} - ProductName: ${doc.productName || 'N/A'} - Qty: ${doc.totalQuantity || 0}`);
        });
        console.log('   ---');
      }
    }

    // Get total count for reference
    const totalCount = await ProductDailySummary.countDocuments();
    console.log(`\n📊 Total ProductDailySummary entries: ${totalCount}`);

    // Also check for entries with same productName and companyId (in case productId is different but name is same)
    console.log('\n🔍 Checking for duplicates by ProductName + CompanyId...\n');

    const nameBasedDuplicates = await ProductDailySummary.aggregate([
      {
        $match: {
          productName: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: {
            productName: "$productName",
            companyId: "$companyId"
          },
          count: { $sum: 1 },
          productIds: { $addToSet: "$productId" },
          documents: { $push: { 
            _id: "$_id", 
            productId: "$productId", 
            date: "$date", 
            totalQuantity: "$totalQuantity" 
          }}
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

    if (nameBasedDuplicates.length === 0) {
      console.log('✅ No duplicate entries by product name found!');
    } else {
      console.log(`❌ Found ${nameBasedDuplicates.length} sets of duplicate entries by product name:\n`);
      
      nameBasedDuplicates.forEach((duplicate, i) => {
        console.log(`${i + 1}. Product Name: "${duplicate._id.productName}"`);
        console.log(`   Company ID: ${duplicate._id.companyId}`);
        console.log(`   Duplicate Count: ${duplicate.count} entries`);
        console.log(`   Different Product IDs: ${duplicate.productIds.length}`);
        console.log(`   Product IDs: ${duplicate.productIds.join(', ')}`);
        console.log(`   Documents:`);
        
        duplicate.documents.forEach((doc, index) => {
          console.log(`     ${index + 1}) ${doc._id} - ProductID: ${doc.productId} - Date: ${doc.date} - Qty: ${doc.totalQuantity || 0}`);
        });
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

// Run the check
checkDuplicateProductSummaries();