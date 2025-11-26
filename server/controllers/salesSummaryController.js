import ProductDailySummary from '../models/ProductDailySummary.js';
import { getSalesBreakdown } from '../services/productionSummaryService.js';
import { Item } from '../models/Inventory.js';
import mongoose from 'mongoose';

/**
 * GET /api/sales/summary
 * Get daily sales summary for all products (for Sales Approval Dashboard)
 */
export const getSalesSummary = async (req, res) => {
  try {
    const { date, companyId } = req.query;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    // Date handling
    let summaryDate;
    if (date) {
      summaryDate = new Date(date);
      if (isNaN(summaryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
    } else {
      summaryDate = new Date(); // Today
    }
    summaryDate.setUTCHours(0, 0, 0, 0);

    // Company filtering based on user role
    let filterCompanyId;
    if (userRole === 'Unit Manager' || userRole === 'Unit Head') {
      // Unit managers can only see their company data
      if (!userCompanyId) {
        return res.status(403).json({
          success: false,
          message: 'User not assigned to any company'
        });
      }
      filterCompanyId = userCompanyId;
    } else if (userRole === 'Super Admin' && companyId) {
      // Super admin can filter by specific company
      filterCompanyId = companyId;
    } else if (userRole === 'Super Admin') {
      // Super admin sees all companies if no filter
      filterCompanyId = null;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access sales summary'
      });
    }

    // Build query filter
    const filter = { date: summaryDate };
    if (filterCompanyId) {
      filter.companyId = new mongoose.Types.ObjectId(filterCompanyId);
    }

    // Get all summaries for the date
    const summaries = await ProductDailySummary.find(filter)
      .populate('productId', 'name')
      .populate('companyId', 'name')
      .sort({ productName: 1 });

    // If no summaries exist, get all products and create default summaries
    if (summaries.length === 0 && filterCompanyId) {
      console.log(`No summaries found for ${summaryDate.toISOString().split('T')[0]}, creating defaults...`);
      
      // Get all products (for company-specific or all)
      const productFilter = {};
      if (filterCompanyId) {
        // For now, we'll create summaries for all products
        // In a real scenario, you might want to filter products by company
      }
      
      const products = await Item.find(productFilter).select('_id name');
      
      // Create default summaries
      const defaultSummaries = [];
      for (const product of products) {
        const summary = new ProductDailySummary({
          date: summaryDate,
          companyId: filterCompanyId,
          productId: product._id,
          productName: product.name,
          qtyPerBatch: 0,
          packing: 0,
          physicalStock: 0,
          batchAdjusted: 0,
          totalIndent: 0
        });
        summary.calculateFormulas();
        await summary.save();
        defaultSummaries.push(summary);
      }
      
      // Re-query to get populated data
      const newSummaries = await ProductDailySummary.find(filter)
        .populate('productId', 'name')
        .populate('companyId', 'name')
        .sort({ productName: 1 });
      
      summaries.push(...newSummaries);
    }

    // Format response data - filter out summaries with missing products
    console.log(`📊 Total summaries found: ${summaries.length}`);
    
    // Log summaries with null productId
    const nullProductIdSummaries = summaries.filter(summary => !summary.productId);
    if (nullProductIdSummaries.length > 0) {
      console.log(`🚨 Found ${nullProductIdSummaries.length} summaries with null productId:`);
      nullProductIdSummaries.forEach((summary, index) => {
        console.log(`  ${index + 1}. ID: ${summary._id}, ProductName: ${summary.productName}, Date: ${summary.date}`);
      });
    }
    
    const validSummaries = summaries.filter(summary => summary.productId && summary.productId._id);
    console.log(`✅ Valid summaries after filtering: ${validSummaries.length}`);
    
    const products = await Promise.all(validSummaries.map(async (summary) => {
      try {
        // Get sales breakdown
        const salesBreakdown = await getSalesBreakdown(
          summary.productId._id,
          summaryDate,
          summary.companyId._id || summary.companyId
        );

        return {
          productId: summary.productId._id,
          productName: summary.productName,
          qtyPerBatch: summary.qtyPerBatch,
          summary: {
            totalIndent: summary.totalIndent,
            physicalStock: summary.physicalStock,
            packing: summary.packing,
            batchAdjusted: summary.batchAdjusted,
            productionFinalBatches: summary.productionFinalBatches,
            toBeProducedDay: summary.toBeProducedDay,
            toBeProducedBatches: summary.toBeProducedBatches,
            expiryShortage: summary.expiryShortage,
            produceBatches: summary.produceBatches,
          },
          salesBreakdown: salesBreakdown
        };
      } catch (error) {
        console.error(`Error processing summary for product ${summary.productName}:`, error);
        return null;
      }
    }));

    // Filter out null results
    const validProducts = products.filter(product => product !== null);

    res.json({
      success: true,
      date: summaryDate.toISOString().split('T')[0],
      companyId: filterCompanyId,
      products: validProducts
    });

  } catch (error) {
    console.error('Error getting sales summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * POST /api/sales/update-summary
 * Update manual input fields and recalculate formulas
 */
export const updateSalesSummary = async (req, res) => {
  try {
    const { date, productId, updates } = req.body;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    // Validation
    if (!date || !productId || !updates) {
      return res.status(400).json({
        success: false,
        message: 'Date, productId, and updates are required'
      });
    }

    // Date validation
    const summaryDate = new Date(date);
    if (isNaN(summaryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    summaryDate.setUTCHours(0, 0, 0, 0);

    // Validate updates object
    const allowedFields = ['packing', 'batchAdjusted', 'physicalStock', 'qtyPerBatch'];
    const updateFields = {};
    
    for (const [field, value] of Object.entries(updates)) {
      if (!allowedFields.includes(field)) {
        return res.status(400).json({
          success: false,
          message: `Field '${field}' is not allowed for updates`
        });
      }
      
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        return res.status(400).json({
          success: false,
          message: `Field '${field}' must be a non-negative number`
        });
      }
      
      updateFields[field] = numValue;
    }

    // Product validation
    const product = await Item.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Determine company ID for summary
    let summaryCompanyId;
    if (userRole === 'Unit Manager' || userRole === 'Unit Head') {
      if (!userCompanyId) {
        return res.status(403).json({
          success: false,
          message: 'User not assigned to any company'
        });
      }
      summaryCompanyId = userCompanyId;
    } else if (userRole === 'Super Admin') {
      // For super admin, use the company from existing summary or user's company
      summaryCompanyId = userCompanyId; // Default fallback
    } else {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update sales summary'
      });
    }

    // Find or create summary document
    let summary = await ProductDailySummary.findOneAndUpdate(
      {
        date: summaryDate,
        companyId: summaryCompanyId,
        productId: new mongoose.Types.ObjectId(productId)
      },
      {
        $setOnInsert: {
          productName: product.name,
          totalIndent: 0,
          // Only set default values for fields NOT being updated
          ...(updateFields.qtyPerBatch === undefined && { qtyPerBatch: 0 }),
          ...(updateFields.packing === undefined && { packing: 0 }),
          ...(updateFields.physicalStock === undefined && { physicalStock: 0 }),
          ...(updateFields.batchAdjusted === undefined && { batchAdjusted: 0 })
        },
        $set: updateFields
      },
      {
        new: true,
        upsert: true
      }
    );

    // Recalculate formulas
    summary.calculateFormulas();
    await summary.save();

    res.json({
      success: true,
      summary: {
        productId: summary.productId,
        productName: summary.productName,
        date: summary.date.toISOString().split('T')[0],
        qtyPerBatch: summary.qtyPerBatch,
        packing: summary.packing,
        batchAdjusted: summary.batchAdjusted,
        physicalStock: summary.physicalStock,
        totalIndent: summary.totalIndent,
        productionFinalBatches: summary.productionFinalBatches,
        toBeProducedDay: summary.toBeProducedDay,
        toBeProducedBatches: summary.toBeProducedBatches,
        expiryShortage: summary.expiryShortage,
        produceBatches: summary.produceBatches,
      }
    });

  } catch (error) {
    console.error('Error updating sales summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};