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

    // Date handling - if no date provided, get all data from all dates
    let summaryDate = null;
    if (date) {
      summaryDate = new Date(date);
      if (isNaN(summaryDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      summaryDate.setUTCHours(0, 0, 0, 0);
    }
    // If summaryDate is null, we'll get all dates

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
    const filter = {};
    if (summaryDate !== null) {
      filter.date = summaryDate; // Filter by specific date only if date was provided
    }
    // If summaryDate is null, no date filter = get all dates
    if (filterCompanyId) {
      filter.companyId = new mongoose.Types.ObjectId(filterCompanyId);
    }

    console.log('🔍 Query filter being used:', filter);
    console.log('📅 Summary date:', summaryDate);
    console.log('🏢 Filter company ID:', filterCompanyId);
    console.log('👤 User role:', userRole);
    console.log('🏢 User company ID:', userCompanyId);

    // Get all summaries for the date
    const summaries = await ProductDailySummary.find(filter)
      .populate('productId', 'name')
      .populate('companyId', 'name')
      .sort({ productName: 1 });

    console.log('📊 Raw summaries found:', summaries.length);
    if (summaries.length > 0) {
      console.log('📋 First few summaries:');
      summaries.slice(0, 3).forEach((s, i) => {
        console.log(`  ${i+1}. ${s.productName} | Date: ${s.date} | Company: ${s.companyId} | ProductId: ${s.productId ? 'exists' : 'NULL'}`);
      });
    } else {
      console.log('❌ No summaries found with filter:', filter);
      // Let's check if there are ANY records at all
      const totalRecords = await ProductDailySummary.countDocuments();
      console.log('🔍 Total ProductDailySummary records in database:', totalRecords);
      
      if (totalRecords > 0) {
        const sampleRecord = await ProductDailySummary.findOne().lean();
        console.log('📋 Sample record from database:', {
          date: sampleRecord.date,
          productName: sampleRecord.productName,
          companyId: sampleRecord.companyId,
          productId: sampleRecord.productId
        });
      }
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
        // Get sales breakdown using the summary's actual date
        const salesBreakdown = await getSalesBreakdown(
          summary.productId._id,
          summary.date, // Always use the summary's own date
          summary.companyId._id || summary.companyId
        );

        return {
          productId: summary.productId._id,
          productName: summary.productName,
          qtyPerBatch: summary.qtyPerBatch,
          totalQuantity: summary.totalQuantity || 0, // ADD totalQuantity from database
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
      date: summaryDate ? summaryDate.toISOString().split('T')[0] : 'all-dates',
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

    console.log('🔍 UPDATE SALES SUMMARY REQUEST:');
    console.log('  📅 Requested Date:', date);
    console.log('  🏢 User Company ID:', userCompanyId);
    console.log('  📦 Product ID:', productId);
    console.log('  📝 Updates:', updates);

    // Validation
    if (!date || !productId || !updates) {
      return res.status(400).json({
        success: false,
        message: 'Date, productId, and updates are required'
      });
    }

    // Date validation - PRESERVE THE ORIGINAL DATE from request
    const summaryDate = new Date(date);
    if (isNaN(summaryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    summaryDate.setUTCHours(0, 0, 0, 0);
    
    console.log('  🎯 Parsed Summary Date (UTC):', summaryDate.toISOString());
    console.log('  📅 Summary Date (Local):', summaryDate.toISOString().split('T')[0]);

    // Validate updates object
    const allowedFields = ['packing', 'productionFinalBatches', 'physicalStock', 'batchAdjusted', 'qtyPerBatch', 'toBeProducedDay', 'produceBatches'];
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

    // Find existing summary document - FIXED: Use only company + product, ignore date completely
    console.log('🔍 Searching for existing summary with:');
    console.log('  🏢 Company ID:', summaryCompanyId);
    console.log('  📦 Product ID:', productId);
    console.log('  ⚠️ IGNORING DATE - Using only company + product for lookup');
    
    let summary = await ProductDailySummary.findOne({
      companyId: summaryCompanyId,
      productId: new mongoose.Types.ObjectId(productId)
    });

    console.log('📋 Found existing summary:', summary ? 'YES' : 'NO');
    if (summary) {
      console.log('  📅 Existing summary date:', summary.date.toISOString());
      console.log('  📅 Existing summary date (local):', summary.date.toISOString().split('T')[0]);
    }

    if (!summary) {
      // Create new summary when explicitly updating through API (legitimate business operation)
      console.log(`✨ Creating new product summary for ${product.name} on ${summaryDate.toISOString().split('T')[0]} via API update`);
      
      summary = new ProductDailySummary({
        date: summaryDate, // IMPORTANT: Use the exact date from request, not current date
        companyId: summaryCompanyId,
        productId: new mongoose.Types.ObjectId(productId),
        productName: product.name,
        totalIndent: 0,
        // Set default values for fields NOT being updated
        qtyPerBatch: updateFields.qtyPerBatch || 0,
        packing: updateFields.packing || 0,
        physicalStock: updateFields.physicalStock || 0,
        batchAdjusted: updateFields.batchAdjusted || 0,
        productionFinalBatches: updateFields.productionFinalBatches || 0,
        toBeProducedDay: updateFields.toBeProducedDay || 0,
        produceBatches: updateFields.produceBatches || 0
      });
      
      console.log('📅 New summary will have date:', summary.date.toISOString());
    } else {
      // Update existing summary - PRESERVE the original date
      console.log('🔄 Updating existing summary, preserving original date:', summary.date.toISOString());
      Object.assign(summary, updateFields);
      // DO NOT modify the date - keep original date
      console.log('📅 After update, summary date remains:', summary.date.toISOString());
    }

    summary.calculateFormulas();
    
    console.log('💾 About to save summary with date:', summary.date.toISOString());
    console.log('📊 Summary fields before save:', {
      date: summary.date.toISOString(),
      productName: summary.productName,
      ...updateFields
    });
    
    await summary.save();
    
    console.log('✅ Summary saved successfully with date:', summary.date.toISOString());
    console.log('📅 Final saved date (local):', summary.date.toISOString().split('T')[0]);

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