import Order from '../models/Order.js';
import ProductDailySummary from '../models/ProductDailySummary.js';
import { Item } from '../models/Inventory.js';
import mongoose from 'mongoose';

/**
 * Update product summary when orders change
 * @param {string} productId - Product ID
 * @param {Date} date - Order date
 * @param {string} companyId - Company ID
 */
export const updateProductSummary = async (productId, date, companyId) => {
  try {
    // Normalize date to start of day
    const summaryDate = new Date(date);
    summaryDate.setUTCHours(0, 0, 0, 0);

    // Get product details
    const product = await Item.findById(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Aggregate total indent for this product/date/company
    const aggregationResult = await Order.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          orderDate: {
            $gte: summaryDate,
            $lt: new Date(summaryDate.getTime() + 24 * 60 * 60 * 1000) // Next day
          },
          'products.product': new mongoose.Types.ObjectId(productId),
          status: { $nin: ['cancelled', 'rejected'] } // Exclude cancelled/rejected orders
        }
      },
      {
        $unwind: '$products'
      },
      {
        $match: {
          'products.product': new mongoose.Types.ObjectId(productId)
        }
      },
      {
        $group: {
          _id: null,
          totalIndent: { $sum: '$products.quantity' }
        }
      }
    ]);

    const totalIndent = aggregationResult.length > 0 ? aggregationResult[0].totalIndent : 0;

    // Find existing summary document (NO AUTO-CREATION)
    let summary = await ProductDailySummary.findOne({
      date: summaryDate,
      companyId: new mongoose.Types.ObjectId(companyId),
      productId: new mongoose.Types.ObjectId(productId)
    });

    if (summary) {
      // Update existing summary
      summary.totalIndent = totalIndent;
      summary.calculateFormulas();
      await summary.save();
      console.log(`Updated product summary for ${product.name} on ${summaryDate.toISOString().split('T')[0]}: totalIndent = ${totalIndent}`);
    } else {
      console.log(`No existing summary found for ${product.name} on ${summaryDate.toISOString().split('T')[0]}, skipping auto-creation`);
      return null;
    }
    
    return summary;
  } catch (error) {
    console.error('Error updating product summary:', error);
    throw error;
  }
};

/**
 * Get sales breakdown for a product on a specific date
 * @param {string} productId - Product ID
 * @param {Date} date - Date
 * @param {string} companyId - Company ID
 */
export const getSalesBreakdown = async (productId, date, companyId) => {
  try {
    // Remove date filtering to match ProductDailySummary logic
    console.log(`🔍 Getting sales breakdown for productId: ${productId}, companyId: ${companyId} (no date filter)`);

    const breakdown = await Order.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
          // Remove date filter - match ProductDailySummary logic
          'products.product': new mongoose.Types.ObjectId(productId),
          status: 'approved' // Only count approved orders for production summary
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'salesPerson',
          foreignField: '_id',
          as: 'salesPersonDetails'
        }
      },
      {
        $unwind: '$products'
      },
      {
        $match: {
          'products.product': new mongoose.Types.ObjectId(productId)
        }
      },
      // STEP 1: Group by ORDER to get total quantity per order per salesperson
      {
        $group: {
          _id: {
            orderId: '$_id',
            salesPersonId: '$salesPerson'
          },
          salesPersonName: { $first: { $ifNull: [{ $arrayElemAt: ['$salesPersonDetails.fullName', 0] }, { $arrayElemAt: ['$salesPersonDetails.username', 0] }] } },
          orderQuantity: { $sum: '$products.quantity' } // Sum quantity for this product in this order
        }
      },
      // STEP 2: Group by SALESPERSON to get total across all their orders
      {
        $group: {
          _id: '$_id.salesPersonId',
          salesPersonName: { $first: '$salesPersonName' },
          totalQuantity: { $sum: '$orderQuantity' }, // Sum all order quantities
          orderCount: { $sum: 1 } // Count number of orders
        }
      },
      {
        $project: {
          salesPersonId: '$_id',
          salesPersonName: { $ifNull: ['$salesPersonName', 'Unknown'] },
          totalQuantity: 1,
          orderCount: 1,
          _id: 0
        }
      }
    ]);

    return breakdown;
  } catch (error) {
    console.error('Error getting sales breakdown:', error);
    return [];
  }
};

/**
 * Initialize summary for a new product
 * @param {string} productId - Product ID
 * @param {string} productName - Product name
 * @param {string} companyId - Company ID
 */
export const initializeProductSummary = async (productId, productName, companyId) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if summary already exists for today
    const existingSummary = await ProductDailySummary.findOne({
      date: today,
      companyId: new mongoose.Types.ObjectId(companyId),
      productId: new mongoose.Types.ObjectId(productId)
    });

    if (existingSummary) {
      console.log(`Summary already exists for product ${productName} on ${today.toISOString().split('T')[0]}`);
      return existingSummary;
    }

    // Create new summary with default values
    const summary = new ProductDailySummary({
      date: today,
      companyId: new mongoose.Types.ObjectId(companyId),
      productId: new mongoose.Types.ObjectId(productId),
      productName: productName,
      qtyPerBatch: 0,
      packing: 0,
      physicalStock: 0,
      batchAdjusted: 0,
      totalIndent: 0
    });

    summary.calculateFormulas();
    await summary.save();

    console.log(`Initialized summary for new product: ${productName}`);
    return summary;
  } catch (error) {
    console.error('Error initializing product summary:', error);
    throw error;
  }
};