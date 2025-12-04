import PackingSheet from '../models/Packing.js';
import ProductionGroup from '../models/ProductionGroup.js';
import ProductDailySummary from '../models/ProductDailySummary.js';
import { Item } from '../models/Inventory.js';

// Get all production groups with item details for packing sheet
export const getProductionGroupsForPacking = async (req, res) => {
  try {
    console.log('📦 Getting production groups for packing sheet');
    console.log('User details:', {
      username: req.user?.username,
      role: req.user?.role,
      companyId: req.user?.companyId
    });

    let query = { isActive: true };

    // Company filtering
    if (req.user.companyId) {
      query.company = req.user.companyId;
    }

    // Get production groups with populated items
    const productionGroups = await ProductionGroup.find(query)
      .populate({
        path: 'items',
        select: 'name code category qty unit price image',
        match: { isActive: { $ne: false } } // Only active items
      })
      .populate({
        path: 'createdBy',
        select: 'username'
      })
      .lean();

    console.log(`Found ${productionGroups.length} production groups`);

    // Transform data for packing sheet display
    const packingData = await Promise.all(productionGroups.map(async (group) => {
      const groupItems = [];
      
      if (group.items && group.items.length > 0) {
        for (const item of group.items) {
          try {
            groupItems.push({
              _id: item._id,
              name: item.name,
              code: item.code,
              category: item.category,
              unit: item.unit || '',
              image: item.image,
              currentStock: item.qty || 0,
              // Use qtyPerBatch from ProductionGroup model as Produced Qty
              producedQty: group.qtyPerBatch || 0,
              achievedQty: group.qtyAchievedPerBatch || 0,
              // Packing quantities (will be entered manually)
              packedQty: 0,
              notes: ''
            });

          } catch (itemError) {
            console.error(`Error processing item ${item.name}:`, itemError);
            // Add item with default values if error occurs
            groupItems.push({
              _id: item._id,
              name: item.name,
              code: item.code,
              category: item.category,
              unit: item.unit || '',
              image: item.image,
              currentStock: item.qty || 0,
              producedQty: group.qtyPerBatch || 0,
              achievedQty: group.qtyAchievedPerBatch || 0,
              packedQty: 0,
              notes: ''
            });
          }
        }
      }

      return {
        _id: group._id,
        name: group.name,
        description: group.description || '',
        totalItems: groupItems.length,
        // Production Group level quantities
        qtyPerBatch: group.qtyPerBatch || 0,
        qtyAchievedPerBatch: group.qtyAchievedPerBatch || 0,
        productionLoss: group.productionLoss || 0,
        items: groupItems,
        createdBy: group.createdBy?.username || 'Unknown',
        createdAt: group.createdAt
      };
    }));

    console.log('Production groups processed for packing:', packingData.length);

    res.json({
      success: true,
      message: 'Production groups for packing fetched successfully',
      data: {
        productionGroups: packingData,
        totalGroups: packingData.length
      }
    });

  } catch (error) {
    console.error('Error fetching production groups for packing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production groups for packing',
      error: error.message
    });
  }
};

// Get all packing sheets for today or specific date
export const getPackingSheets = async (req, res) => {
  try {
    const { date, status } = req.query;
    console.log('📋 Getting packing sheets', { date, status });

    let query = { company: req.user.companyId, isActive: true };

    // Filter by date (default to today)
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.packingDate = { $gte: startOfDay, $lte: endOfDay };
    } else {
      // Default to today
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      query.packingDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const packingSheets = await PackingSheet.find(query)
      .populate({
        path: 'productionGroup',
        select: 'name description'
      })
      .populate({
        path: 'createdBy',
        select: 'username'
      })
      .sort({ slNo: 1 });

    console.log(`Found ${packingSheets.length} packing sheets`);

    res.json({
      success: true,
      message: 'Packing sheets fetched successfully',
      data: {
        packingSheets,
        totalSheets: packingSheets.length
      }
    });

  } catch (error) {
    console.error('Error fetching packing sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packing sheets',
      error: error.message
    });
  }
};

// Create a new packing sheet
export const createPackingSheet = async (req, res) => {
  try {
    const { productionGroupId, items, shift } = req.body;
    console.log('📋 Creating new packing sheet for group:', productionGroupId);

    // Validate production group exists and belongs to user's company
    const productionGroup = await ProductionGroup.findOne({
      _id: productionGroupId,
      company: req.user.companyId,
      isActive: true
    });

    if (!productionGroup) {
      return res.status(404).json({
        success: false,
        message: 'Production group not found'
      });
    }

    // Get next serial number
    const nextSlNo = await PackingSheet.getNextSlNo(req.user.companyId);

    // Create packing sheet
    const packingSheet = new PackingSheet({
      slNo: nextSlNo,
      productionGroup: productionGroupId,
      productionGroupName: productionGroup.name,
      items: items || [],
      shift: shift || 'morning',
      company: req.user.companyId,
      createdBy: req.user.id,
      lastUpdatedBy: req.user.id
    });

    await packingSheet.save();

    console.log('Packing sheet created:', packingSheet._id);

    res.status(201).json({
      success: true,
      message: 'Packing sheet created successfully',
      data: packingSheet
    });

  } catch (error) {
    console.error('Error creating packing sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create packing sheet',
      error: error.message
    });
  }
};

// Start packing timing for a packing sheet
export const startPackingTiming = async (req, res) => {
  try {
    const { packingSheetId } = req.params;
    console.log('⏰ Starting packing timing for sheet:', packingSheetId);

    const packingSheet = await PackingSheet.findOne({
      _id: packingSheetId,
      company: req.user.companyId
    });

    if (!packingSheet) {
      return res.status(404).json({
        success: false,
        message: 'Packing sheet not found'
      });
    }

    // Start timing
    await packingSheet.startPacking();
    packingSheet.lastUpdatedBy = req.user.id;
    await packingSheet.save();

    console.log('Packing started at:', packingSheet.packingStartTime);

    res.json({
      success: true,
      message: 'Packing timing started successfully',
      data: {
        packingSheetId: packingSheet._id,
        packingStartTime: packingSheet.packingStartTime,
        status: packingSheet.status
      }
    });

  } catch (error) {
    console.error('Error starting packing timing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start packing timing',
      error: error.message
    });
  }
};

// Stop packing timing for a packing sheet
export const stopPackingTiming = async (req, res) => {
  try {
    const { packingSheetId } = req.params;
    console.log('⏰ Stopping packing timing for sheet:', packingSheetId);

    const packingSheet = await PackingSheet.findOne({
      _id: packingSheetId,
      company: req.user.companyId
    });

    if (!packingSheet) {
      return res.status(404).json({
        success: false,
        message: 'Packing sheet not found'
      });
    }

    // Stop timing
    await packingSheet.endPacking();
    packingSheet.lastUpdatedBy = req.user.id;
    await packingSheet.save();

    console.log('Packing ended at:', packingSheet.packingEndTime);

    res.json({
      success: true,
      message: 'Packing timing stopped successfully',
      data: {
        packingSheetId: packingSheet._id,
        packingStartTime: packingSheet.packingStartTime,
        packingEndTime: packingSheet.packingEndTime,
        status: packingSheet.status
      }
    });

  } catch (error) {
    console.error('Error stopping packing timing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop packing timing',
      error: error.message
    });
  }
};

// Update packing loss for a packing sheet
export const updatePackingLoss = async (req, res) => {
  try {
    const { packingSheetId } = req.params;
    const { packingLoss } = req.body;
    console.log('📉 Updating packing loss for sheet:', packingSheetId, 'Loss:', packingLoss);

    if (packingLoss < 0) {
      return res.status(400).json({
        success: false,
        message: 'Packing loss cannot be negative'
      });
    }

    const packingSheet = await PackingSheet.findOne({
      _id: packingSheetId,
      company: req.user.companyId
    });

    if (!packingSheet) {
      return res.status(404).json({
        success: false,
        message: 'Packing sheet not found'
      });
    }

    // Update packing loss
    packingSheet.packingLoss = packingLoss;
    packingSheet.lastUpdatedBy = req.user.id;
    await packingSheet.save();

    console.log('Packing loss updated to:', packingLoss);

    res.json({
      success: true,
      message: 'Packing loss updated successfully',
      data: {
        packingSheetId: packingSheet._id,
        packingLoss: packingSheet.packingLoss
      }
    });

  } catch (error) {
    console.error('Error updating packing loss:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update packing loss',
      error: error.message
    });
  }
};

// Update item quantities in packing sheet
export const updatePackingQuantities = async (req, res) => {
  try {
    const { packingSheetId } = req.params;
    const { items } = req.body;
    console.log('📦 Updating packing quantities for sheet:', packingSheetId);

    const packingSheet = await PackingSheet.findOne({
      _id: packingSheetId,
      company: req.user.companyId
    });

    if (!packingSheet) {
      return res.status(404).json({
        success: false,
        message: 'Packing sheet not found'
      });
    }

    // Update item quantities
    if (items && Array.isArray(items)) {
      items.forEach(updateItem => {
        const existingItem = packingSheet.items.find(
          item => item.productId.toString() === updateItem.productId
        );
        
        if (existingItem) {
          existingItem.indentQty = updateItem.indentQty || existingItem.indentQty;
          existingItem.producedQty = updateItem.producedQty || existingItem.producedQty;
          existingItem.packedQty = updateItem.packedQty || existingItem.packedQty;
          existingItem.notes = updateItem.notes || existingItem.notes;
        }
      });
    }

    packingSheet.lastUpdatedBy = req.user.id;
    await packingSheet.save();

    console.log('Packing quantities updated');

    res.json({
      success: true,
      message: 'Packing quantities updated successfully',
      data: {
        packingSheetId: packingSheet._id,
        totalPackedQty: packingSheet.totalPackedQty,
        items: packingSheet.items
      }
    });

  } catch (error) {
    console.error('Error updating packing quantities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update packing quantities',
      error: error.message
    });
  }
};

// Get packing sheet by ID
export const getPackingSheetById = async (req, res) => {
  try {
    const { packingSheetId } = req.params;
    console.log('🔍 Getting packing sheet by ID:', packingSheetId);

    const packingSheet = await PackingSheet.findOne({
      _id: packingSheetId,
      company: req.user.companyId
    })
      .populate({
        path: 'productionGroup',
        select: 'name description'
      })
      .populate({
        path: 'createdBy',
        select: 'username'
      })
      .populate({
        path: 'lastUpdatedBy',
        select: 'username'
      });

    if (!packingSheet) {
      return res.status(404).json({
        success: false,
        message: 'Packing sheet not found'
      });
    }

    res.json({
      success: true,
      message: 'Packing sheet fetched successfully',
      data: packingSheet
    });

  } catch (error) {
    console.error('Error fetching packing sheet by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packing sheet',
      error: error.message
    });
  }
};

// Get packing statistics
export const getPackingStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('📊 Getting packing statistics');

    let dateQuery = { company: req.user.companyId, isActive: true };

    // Set date range (default to last 30 days)
    if (startDate && endDate) {
      dateQuery.packingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateQuery.packingDate = { $gte: thirtyDaysAgo };
    }

    // Get aggregated statistics
    const stats = await PackingSheet.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalSheets: { $sum: 1 },
          completedSheets: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalPackedQty: { $sum: '$totalPackedQty' },
          totalPackingLoss: { $sum: '$packingLoss' },
          avgPackingLoss: { $avg: '$packingLoss' }
        }
      }
    ]);

    const result = stats[0] || {
      totalSheets: 0,
      completedSheets: 0,
      totalPackedQty: 0,
      totalPackingLoss: 0,
      avgPackingLoss: 0
    };

    // Get today's stats
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todaySheets = await PackingSheet.countDocuments({
      company: req.user.companyId,
      packingDate: { $gte: startOfDay, $lte: endOfDay },
      isActive: true
    });

    res.json({
      success: true,
      message: 'Packing statistics fetched successfully',
      data: {
        overview: result,
        todaySheets,
        efficiency: result.totalSheets > 0 ? 
          (result.completedSheets / result.totalSheets * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching packing statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packing statistics',
      error: error.message
    });
  }
};