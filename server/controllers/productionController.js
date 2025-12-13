import ProductionGroup from '../models/ProductionGroup.js';
import ProductDailySummary from '../models/ProductDailySummary.js';
import ProductDetailsDailySummary from '../models/ProductDetailsDailySummary.js';
import { Item } from '../models/Inventory.js';
import User from '../models/User.js';
import UngroupedItemProduction from '../models/UngroupedItemProduction.js';
import ProductionBatchData from '../models/ProductionBatchData.js';

// Helper function to calculate number of batches for a production group
const calculateBatchesForGroup = async (groupId, companyId) => {
  try {
    // Get the production group
    const group = await ProductionGroup.findById(groupId);
    if (!group || !group.items || group.items.length === 0) {
      return 0;
    }

    // Get all item IDs from this production group
    const itemIds = group.items.map(item => item._id);
    
    // Query ProductDetailsDailySummary for all items in this group for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const summaryQuery = {
      productId: { $in: itemIds },
      date: {
        $gte: today,
        $lt: tomorrow
      }
    };
    
    // Add company filter if provided
    if (companyId) {
      summaryQuery.companyId = companyId;
    }
    
    const productDetailsSummaries = await ProductDetailsDailySummary.find(summaryQuery);
    
    // Calculate total batchAdjusted for all items in this group
    const totalBatches = productDetailsSummaries.reduce((total, summary) => {
      return total + (summary.batchAdjusted || 0);
    }, 0);
    
    return totalBatches;
  } catch (error) {
    console.error('Error calculating batches for group:', error);
    return 0;
  }
};

// Get production dashboard statistics and recent data
export const getProductionDashboard = async (req, res) => {
  try {
    console.log('📊 Production Dashboard Request');
    console.log('User details:', {
      username: req.user?.username || 'Unknown',
      role: req.user?.role || 'Unknown',
      companyId: req.user?.companyId || 'Unknown'
    });

    // Validate user and company
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let query = {};

    // COMPANY FILTERING: Only show data from the same company
    if (req.user.companyId) {
      query.company = req.user.companyId;
      console.log('Filtering by company:', req.user.companyId);
    } else {
      console.log('⚠️ Warning: User has no company ID, showing all data');
    }

    // ACTIVE STATUS FILTERING: Only show active production groups
    query.isActive = true;
    console.log('Filtering by isActive: true');

    // UNIT/LOCATION FILTERING: Only show production groups assigned to this user
    // Unit Heads and Unit Managers should only see their assigned production groups
    if (req.user.role === 'Unit Head' || req.user.role === 'Unit Manager') {
      query.unitHeadOrManager = req.user._id;
      console.log('Filtering by unitHeadOrManager:', req.user._id, '(Role:', req.user.role, ')');
    }
    // Super Admin and other roles can see all production groups in their company

    // Get all production groups with error handling
    console.log('Querying ProductionGroup with filter:', query);
    
    let allGroups = [];
    try {
      allGroups = await ProductionGroup.find(query)
        .populate({
          path: 'items',
          select: 'name code category qty unit'
        })
        .populate({
          path: 'createdBy',
          select: 'username'
        })
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`Found ${allGroups.length} production groups`);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error while fetching production groups',
        error: dbError.message
      });
    }

    // Ensure allGroups is an array
    if (!Array.isArray(allGroups)) {
      allGroups = [];
    }

    // Calculate production batches for each group from ProductDailySummary
    const dashBoardData = [];
    
    for (const group of allGroups) {
      try {
        if (!group.items || group.items.length === 0) {
          // If no items in group, add with 0 batches
          dashBoardData.push({
            productGroup: group.name,
            noOfBatchesForProduction: 0
          });
          continue;
        }

        // Get all item IDs from this production group
        const itemIds = group.items.map(item => item._id);
        
        // Query ProductDetailsDailySummary for all items in this group for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const summaryQuery = {
          productId: { $in: itemIds },
          date: {
            $gte: today,
            $lt: tomorrow
          }
        };
        
        // Add company filter if user has company
        if (req.user.companyId) {
          summaryQuery.companyId = req.user.companyId;
        }
        
        const productDetailsSummaries = await ProductDetailsDailySummary.find(summaryQuery);
        
        // Calculate total batchAdjusted for all items in this group
        const totalBatches = productDetailsSummaries.reduce((total, summary) => {
          return total + (summary.batchAdjusted || 0);
        }, 0);
        
        dashBoardData.push({
          productGroup: group.name,
          noOfBatchesForProduction: totalBatches
        });
        
        console.log(`Group "${group.name}": ${group.items.length} items, ${totalBatches} total batches`);
        
      } catch (groupError) {
        console.error(`Error processing group "${group.name}":`, groupError);
        // Add group with 0 batches if error occurs
        dashBoardData.push({
          productGroup: group.name,
          noOfBatchesForProduction: 0
        });
      }
    }

    console.log('Dashboard data calculated:', dashBoardData);

    // Calculate simple summary stats
    const totalGroups = allGroups.length;
    const totalItems = allGroups.reduce((total, group) => {
      return total + (group.items ? group.items.length : 0);
    }, 0);

    // Return the new dashboard format with simple stats
    res.json({
      success: true,
      message: 'Production dashboard data fetched successfully',
      data: dashBoardData,
      stats: {
        totalGroups: totalGroups,
        totalItems: totalItems
      }
    });

  } catch (error) {
    console.error('Error fetching production dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production dashboard data',
      error: error.message
    });
  }
};

// Get all production groups with their items and total quantities for shift management
export const getProductionShiftData = async (req, res) => {
  try {
    console.log('🏭 Production Shift Data Request');
    console.log('User details:', {
      username: req.user?.username,
      role: req.user?.role,
      companyId: req.user?.companyId
    });

    let query = {};

    // COMPANY FILTERING: Only show production groups from the same company
    if (req.user.companyId) {
      query.company = req.user.companyId;
      console.log('Filtering production groups by company:', req.user.companyId);
    }

    // ACTIVE FILTERING: Only show active production groups for production shift
    query.isActive = true;

    const productionGroups = await ProductionGroup.find(query)
      .populate({
        path: 'items',
        select: 'name code category qty unit price image'
      })
      .populate({
        path: 'createdBy',
        select: 'username'
      })
      .lean();

    console.log(`Found ${productionGroups.length} production groups`);

    // Get ProductDailySummary data for batch quantities
    const ProductDailySummary = (await import('../models/ProductDailySummary.js')).default;
    
    // Transform data for production shift display
    const shiftData = await Promise.all(productionGroups.map(async (group) => {
      // Use batch quantities directly from the ProductionGroup model
      const groupQtyPerBatch = group.qtyPerBatch || 0;
      const groupQtyAchievedPerBatch = group.qtyAchievedPerBatch || 0;
      
      const itemsWithBatchQty = [];
      
      if (group.items && group.items.length > 0) {
        for (const item of group.items) {
          // Get ProductDailySummary data for this specific item
          const itemSummary = await ProductDailySummary.findOne({
            productId: item._id,
            companyId: req.user.companyId
          }).lean();

          // Add item data with ProductDailySummary fields
          itemsWithBatchQty.push({
            _id: item._id,
            name: item.name,
            code: item.code,
            category: item.category,
            qty: item.qty || 0,
            unit: item.unit || '',
            price: item.price || 0,
            image: item.image,
            productionFinalBatches: itemSummary?.productionFinalBatches || 0,
            qtyPerBatch: itemSummary?.qtyPerBatch || 0
          });
        }
      }
      
      const totalItems = group.items?.length || 0;
      const totalCurrentQuantity = group.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;

      console.log(`Group ${group.name}:`, {
        totalItems,
        totalCurrentQuantity,
        qtyPerBatch: groupQtyPerBatch,
        qtyAchievedPerBatch: groupQtyAchievedPerBatch,
        mouldingTime: group.mouldingTime,
        unloadingTime: group.unloadingTime, 
        productionLoss: group.productionLoss
      });

      // Load individual batch data for this group
      const batchCount = await calculateBatchesForGroup(group._id, req.user.companyId);
      const batchDataArray = await ProductionBatchData.find({
        groupId: group._id,
        company: req.user.companyId
      }).lean();

      // Create batch data map for easy access
      const batchDataMap = {};
      batchDataArray.forEach(batch => {
        batchDataMap[batch.batchKey] = {
          mouldingTime: batch.mouldingTime ? batch.mouldingTime.toISOString().slice(0, 16) : null,
          unloadingTime: batch.unloadingTime ? batch.unloadingTime.toISOString().slice(0, 16) : null,
          productionLoss: batch.productionLoss || 0,
          qtyAchieved: batch.qtyAchieved || 0
        };
      });

      return {
        _id: group._id,
        name: group.name,
        description: group.description || '',
        totalItems: totalItems,
        totalQuantity: totalCurrentQuantity, // Keep for backward compatibility
        // Batch quantity fields from ProductionGroup model
        qtyPerBatch: groupQtyPerBatch,
        qtyAchievedPerBatch: groupQtyAchievedPerBatch,
        // Calculate number of batches for production
        noOfBatchesForProduction: batchCount,
        // Individual batch data
        batchData: batchDataMap,
        unitHeadOrManager: group.unitHeadOrManager || null,
        // Format time fields properly for frontend
        mouldingTime: group?.mouldingTime ? 
          group.mouldingTime.toISOString().slice(0, 16) : null,
        unloadingTime: group?.unloadingTime ? 
          group.unloadingTime.toISOString().slice(0, 16) : null,
        productionLoss: group?.productionLoss !== undefined ? group.productionLoss : 0,
        items: itemsWithBatchQty,
        createdBy: group.createdBy?.username || 'Unknown',
        createdAt: group.createdAt,
        isActive: group.isActive !== false
      };
    }));

    res.json({
      success: true,
      message: 'Production shift data fetched successfully',
      data: {
        groups: shiftData,
        totalGroups: shiftData.length,
        totalActiveGroups: shiftData.filter(g => g.isActive).length
      }
    });

  } catch (error) {
    console.error('Error fetching production shift data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production shift data',
      error: error.message
    });
  }
};

// Get specific production group details for shift management
export const getProductionGroupShiftDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    console.log('🔍 Getting production group shift details for ID:', groupId);

    let query = { _id: groupId };

    // COMPANY FILTERING: Only show production groups from the same company
    if (req.user.companyId) {
      query.company = req.user.companyId;
    }

    const group = await ProductionGroup.findOne(query)
      .populate({
        path: 'items',
        select: 'name code category qty unit price image'
      })
      .populate({
        path: 'createdBy',
        select: 'username'
      })
      .lean();

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Production group not found'
      });
    }

    // Calculate batch details
    const totalQuantity = group.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
    const totalItems = group.items?.length || 0;

    const shiftDetails = {
      _id: group._id,
      name: group.name,
      description: group.description || '',
      totalItems: totalItems,
      totalQuantity: totalQuantity,
      items: group.items?.map(item => ({
        _id: item._id,
        name: item.name,
        code: item.code,
        category: item.category,
        qty: item.qty || 0,
        unit: item.unit || '',
        price: item.price || 0,
        image: item.image,
        // Production shift specific data
        mouldingTime: '00:00', // Default values for shift management
        unloadingTime: '00:00',
        productionLoss: 0,
        qtyAchieved: item.qty || 0
      })) || [],
      createdBy: group.createdBy?.username || 'Unknown',
      createdAt: group.createdAt,
      isActive: group.isActive !== false
    };

    res.json({
      success: true,
      message: 'Production group shift details fetched successfully',
      data: shiftDetails
    });

  } catch (error) {
    console.error('Error fetching production group shift details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production group shift details',
      error: error.message
    });
  }
};

// Update production shift timing data (moulding time, unloading time, etc.)
export const updateProductionShiftTiming = async (req, res) => {
  try {
    // Handle both URL param and body groupId
    let batchKey = req.params.groupId || req.body.groupId;
    const { field, value, timingData } = req.body;
    
    console.log('⏱️ Updating production shift timing for batch:', batchKey);
    console.log('Field:', field, 'Value:', value);
    
    if (!batchKey) {
      return res.status(400).json({
        success: false,
        message: 'Batch key is required'
      });
    }

    let groupId, batchNumber;

    // Extract group ID and batch number from batch key (format: "groupId_batch_X")
    if (batchKey.includes('_batch_')) {
      const parts = batchKey.split('_batch_');
      groupId = parts[0];
      batchNumber = parseInt(parts[1]);
    } else {
      // Backward compatibility: if no batch number, treat as batch 1
      groupId = batchKey;
      batchNumber = 1;
      batchKey = `${groupId}_batch_1`;
    }
    
    console.log('📊 Parsed:', { groupId, batchNumber, batchKey });

    // Verify the production group exists and user has access
    let groupQuery = { _id: groupId };
    if (req.user.companyId) {
      groupQuery.company = req.user.companyId;
    }

    const group = await ProductionGroup.findOne(groupQuery);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Production group not found'
      });
    }

    // Find or create individual batch data
    let batchData = await ProductionBatchData.findOne({ 
      batchKey: batchKey,
      company: req.user.companyId 
    });

    if (!batchData) {
      // Create new batch data record
      batchData = new ProductionBatchData({
        groupId: groupId,
        batchNumber: batchNumber,
        batchKey: batchKey,
        company: req.user.companyId
      });
    }

    // Handle auto-save field updates
    if (field && value !== undefined) {
      switch (field) {
        case 'mouldingTime':
          batchData.mouldingTime = value ? new Date(value) : null;
          break;
        case 'unloadingTime':
          batchData.unloadingTime = value ? new Date(value) : null;
          break;
        case 'productionLoss':
          batchData.productionLoss = parseFloat(value) || 0;
          
          // Auto-calculate qtyAchieved when production loss changes
          const qtyPerBatch = group.qtyPerBatch || 0;
          batchData.qtyAchieved = Math.max(0, qtyPerBatch - batchData.productionLoss);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Invalid field: ${field}`
          });
      }

      await batchData.save();

      console.log('✅ Batch timing updated successfully:', {
        batchKey,
        field,
        value,
        updatedData: batchData
      });

      return res.json({
        success: true,
        message: `${field} updated successfully`,
        data: {
          batchKey: batchKey,
          groupId: groupId,
          batchNumber: batchNumber,
          field,
          value,
          updatedAt: batchData.updatedAt
        }
      });
    }

    // Handle bulk timing data updates (if needed for backward compatibility)
    if (timingData) {
      if (timingData.mouldingTime !== undefined) {
        batchData.mouldingTime = timingData.mouldingTime ? new Date(timingData.mouldingTime) : null;
      }
      if (timingData.unloadingTime !== undefined) {
        batchData.unloadingTime = timingData.unloadingTime ? new Date(timingData.unloadingTime) : null;
      }
      if (timingData.productionLoss !== undefined) {
        batchData.productionLoss = parseFloat(timingData.productionLoss) || 0;
        
        // Auto-calculate qtyAchieved
        const qtyPerBatch = group.qtyPerBatch || 0;
        batchData.qtyAchieved = Math.max(0, qtyPerBatch - batchData.productionLoss);
      }

      await batchData.save();

      return res.json({
        success: true,
        message: 'Production shift timing updated successfully',
        data: {
          batchKey: batchKey,
          groupId: groupId,
          batchNumber: batchNumber,
          timingData: {
            mouldingTime: batchData.mouldingTime,
            unloadingTime: batchData.unloadingTime,
            productionLoss: batchData.productionLoss,
            qtyAchieved: batchData.qtyAchieved
          },
          updatedAt: batchData.updatedAt
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: 'No valid update data provided'
    });

  } catch (error) {
    console.error('Error updating production shift timing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update production shift timing',
      error: error.message
    });
  }
};

// Debug endpoint to check ProductDailySummary data
export const debugProductSummaryData = async (req, res) => {
  try {
    console.log('🔍 Debug: Checking ProductDailySummary data...');
    
    const ProductDailySummary = (await import('../models/ProductDailySummary.js')).default;
    
    // Get all ProductDailySummary records for this company
    const summaries = await ProductDailySummary.find({
      companyId: req.user.companyId
    }).lean();
    
    console.log(`Found ${summaries.length} ProductDailySummary records for company: ${req.user.companyId}`);
    
    // Also get summaries without company filter to see all data
    const allSummaries = await ProductDailySummary.find({}).lean();
    console.log(`Total ProductDailySummary records in database: ${allSummaries.length}`);
    
    // Get production groups to compare
    const ProductionGroup = (await import('../models/ProductionGroup.js')).default;
    const groups = await ProductionGroup.find({ 
      company: req.user.companyId,
      isActive: true 
    }).populate('items', 'name code').lean();
    
    const itemNames = groups.flatMap(g => g.items?.map(i => i.name) || []);
    console.log('Production group item names:', itemNames);
    
    res.json({
      success: true,
      data: {
        companyId: req.user.companyId,
        companySummaries: summaries.map(s => ({
          productName: s.productName,
          productId: s.productId,
          qtyPerBatch: s.qtyPerBatch,
          date: s.date
        })),
        allSummaries: allSummaries.map(s => ({
          productName: s.productName,
          productId: s.productId,
          qtyPerBatch: s.qtyPerBatch,
          companyId: s.companyId,
          date: s.date
        })),
        productionGroupItems: itemNames,
        matches: summaries.filter(s => itemNames.includes(s.productName))
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
};

// Get ungrouped items (items not assigned to any production group)
export const getUngroupedItems = async (req, res) => {
  try {
    console.log('🔍 Production Ungrouped Items Request:', {
      role: req.user.role,
      username: req.user.username,
      companyId: req.user.companyId,
      query: req.query
    });

    // Validate user and company
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required with valid company'
      });
    }

    const { search = '' } = req.query;
    console.log('📝 Search params:', { search });

    // Get total items in company
    const totalCompanyItems = await Item.countDocuments({ store: req.user.companyId });
    console.log('🔢 Total items in company:', totalCompanyItems);

    // Get items already assigned to production groups
    const assignedGroups = await ProductionGroup.find({
      company: req.user.companyId,
      isActive: true
    }).select('items');
    
    const assignedItemIds = assignedGroups.flatMap(group => 
      group.items.map(item => item.toString())
    );
    console.log('🚫 Total assigned items count:', assignedItemIds.length);

    // Build filter for ungrouped items
    const filter = {
      store: req.user.companyId,
      _id: { $nin: assignedItemIds }
    };

    // Add search filter
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    console.log('🔍 Filter object:', JSON.stringify(filter, null, 2));

    // Get ungrouped items
    const items = await Item.find(filter)
      .select('name code category subCategory qty unit price image description store')
      .sort({ name: 1 })
      .lean();

    console.log('📦 Retrieved ungrouped items:', items.length);

    // Format items with proper image URLs and ProductDailySummary data
    const formattedItems = await Promise.all(items.map(async (item) => {
      const imageUrl = item.image ? (item.image.startsWith('/uploads/data:') ? item.image.replace('/uploads/', '') : item.image) : null;
      
      // Get ProductDailySummary data for qtyPerBatch
      const itemSummary = await ProductDailySummary.findOne({
        productId: item._id,
        companyId: req.user.companyId
      }).lean();

      // Get today's ProductDetailsDailySummary for batchAdjusted
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayDetails = await ProductDetailsDailySummary.findOne({
        productId: item._id,
        companyId: req.user.companyId,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      }).lean();

      return {
        _id: item._id,
        name: item.name || 'Unnamed Item',
        code: item.code || 'No Code',
        category: item.category || 'No Category',
        subCategory: item.subCategory || '',
        qty: item.qty || 0,
        unit: item.unit || '',
        price: item.price || 0,
        description: item.description || '',
        image: imageUrl,
        batchAdjusted: todayDetails?.batchAdjusted || 0,
        qtyPerBatch: itemSummary?.qtyPerBatch || 0
      };
    }));

    // Filter out items with batchAdjusted = 0 (only return items with available batchAdjusted)
    const availableItems = formattedItems.filter(item => item.batchAdjusted > 0);
    
    console.log(`📊 Filtered items: ${formattedItems.length} total → ${availableItems.length} with batchAdjusted > 0`);

    console.log('📤 Returning ungrouped items with available batchAdjusted:', {
      total: availableItems.length,
      withImages: availableItems.filter(item => item.image).length,
      assignedItemsCount: assignedItemIds.length,
      totalCompanyItems: totalCompanyItems,
      filteredOut: formattedItems.length - availableItems.length
    });

    res.json({
      success: true,
      data: {
        items: availableItems,
        totalItems: availableItems.length,
        assignedItemsCount: assignedItemIds.length,
        companyItemsCount: totalCompanyItems,
        ungroupedItemsCount: availableItems.length,
        filteredItemsCount: formattedItems.length - availableItems.length
      }
    });
  } catch (error) {
    console.error('Error fetching ungrouped items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ungrouped items',
      error: error.message
    });
  }
};

// Get ungrouped items for production sheet with individual batch entries
export const getUngroupedItemsForSheet = async (req, res) => {
  try {
    console.log('🔍 Production Sheet Ungrouped Items Request:', {
      role: req.user.role,
      username: req.user.username,
      companyId: req.user.companyId,
      query: req.query
    });

    // Validate user and company
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required with valid company'
      });
    }

    const { search = '' } = req.query;
    console.log('📝 Search params:', { search });

    // Get total items in company
    const totalCompanyItems = await Item.countDocuments({ store: req.user.companyId });
    console.log('🔢 Total items in company:', totalCompanyItems);

    // Get items already assigned to production groups
    const assignedGroups = await ProductionGroup.find({
      company: req.user.companyId,
      isActive: true
    }).select('items');
    
    const assignedItemIds = assignedGroups.flatMap(group => 
      group.items.map(item => item.toString())
    );
    console.log('🚫 Total assigned items count:', assignedItemIds.length);

    // Build filter for ungrouped items
    const filter = {
      store: req.user.companyId,
      _id: { $nin: assignedItemIds }
    };

    // Add search filter
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    console.log('🔍 Filter object:', JSON.stringify(filter, null, 2));

    // Get ungrouped items
    const items = await Item.find(filter)
      .select('name code category subCategory qty unit price image description store')
      .sort({ name: 1 })
      .lean();

    console.log('📦 Retrieved ungrouped items:', items.length);

    // Format items with proper image URLs and ProductDailySummary data
    const formattedItems = await Promise.all(items.map(async (item) => {
      const imageUrl = item.image ? (item.image.startsWith('/uploads/data:') ? item.image.replace('/uploads/', '') : item.image) : null;
      
      // Get ProductDailySummary data for qtyPerBatch
      const itemSummary = await ProductDailySummary.findOne({
        productId: item._id,
        companyId: req.user.companyId
      }).lean();

      // Get today's ProductDetailsDailySummary for batchAdjusted
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayDetails = await ProductDetailsDailySummary.findOne({
        productId: item._id,
        companyId: req.user.companyId,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      }).lean();

      return {
        _id: item._id,
        name: item.name || 'Unnamed Item',
        code: item.code || 'No Code',
        category: item.category || 'No Category',
        subCategory: item.subCategory || '',
        qty: item.qty || 0,
        unit: item.unit || '',
        price: item.price || 0,
        description: item.description || '',
        image: imageUrl,
        batchAdjusted: todayDetails?.batchAdjusted || 0,
        qtyPerBatch: itemSummary?.qtyPerBatch || 0
      };
    }));

    // Filter out items with batchAdjusted = 0 and create individual batch entries
    const itemsWithBatches = formattedItems.filter(item => item.batchAdjusted > 0);
    
    // Create individual batch entries for each item based on batchAdjusted
    const batchEntries = [];
    let globalBatchCounter = 1; // Global counter for sequential batch numbers
    
    for (const item of itemsWithBatches) {
      const totalBatches = Math.ceil(item.batchAdjusted); // Round up to get whole number of batches
      
      for (let itemBatchNumber = 1; itemBatchNumber <= totalBatches; itemBatchNumber++) {
        // Calculate quantity for this batch
        let batchQuantity = item.qtyPerBatch;
        
        // For the last batch, if it's a partial batch, calculate the remaining quantity
        if (itemBatchNumber === totalBatches && item.batchAdjusted % 1 !== 0) {
          const remainingBatchFraction = item.batchAdjusted % 1;
          batchQuantity = Math.round(item.qtyPerBatch * remainingBatchFraction);
        }
        
        // Generate formatted batch number with global counter
        const batchNo = `BATNO${globalBatchCounter.toString().padStart(2, '0')}`;
        
        batchEntries.push({
          _id: `${item._id}_batch_${itemBatchNumber}`, // Unique ID for each batch entry
          originalItemId: item._id, // Reference to original item
          name: item.name,
          code: item.code,
          category: item.category,
          subCategory: item.subCategory,
          qty: item.qty,
          unit: item.unit,
          price: item.price,
          description: item.description,
          image: item.image,
          batchNumber: itemBatchNumber, // Item-specific batch number
          batchNo: batchNo, // Global formatted batch number (BATNO01, BATNO02, etc.)
          globalBatchNumber: globalBatchCounter, // Global batch counter
          batchQuantity: batchQuantity,
          qtyPerBatch: item.qtyPerBatch,
          totalBatches: totalBatches,
          originalBatchAdjusted: item.batchAdjusted
        });
        
        globalBatchCounter++; // Increment global counter
      }
    }
    
    console.log(`📊 Batch entries created: ${itemsWithBatches.length} items → ${batchEntries.length} batch entries`);

    console.log('📤 Returning ungrouped items as individual batch entries for production sheet:', {
      totalBatchEntries: batchEntries.length,
      uniqueItems: itemsWithBatches.length,
      withImages: batchEntries.filter(item => item.image).length,
      assignedItemsCount: assignedItemIds.length,
      totalCompanyItems: totalCompanyItems,
      filteredOut: formattedItems.length - itemsWithBatches.length
    });

    res.json({
      success: true,
      data: {
        items: batchEntries,
        totalItems: batchEntries.length,
        totalBatchEntries: batchEntries.length,
        uniqueItems: itemsWithBatches.length,
        assignedItemsCount: assignedItemIds.length,
        companyItemsCount: totalCompanyItems,
        ungroupedItemsCount: batchEntries.length,
        filteredItemsCount: formattedItems.length - itemsWithBatches.length
      }
    });

  } catch (error) {
    console.error('Error fetching ungrouped items for production sheet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ungrouped items for production sheet',
      error: error.message
    });
  }
};

// Get ungrouped item group (duplicate of getUngroupedItems with different function name)
export const getUngroupedItemGroup = async (req, res) => {
  try {
    console.log('🔍 Production Ungrouped Item Group Request:', {
      role: req.user.role,
      username: req.user.username,
      companyId: req.user.companyId,
      query: req.query
    });

    // Validate user and company
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required with valid company'
      });
    }

    const { search = '' } = req.query;
    console.log('📝 Search params:', { search });

    // Get total items in company
    const totalCompanyItems = await Item.countDocuments({ store: req.user.companyId });
    console.log('🔢 Total items in company:', totalCompanyItems);

    // Get items already assigned to production groups
    const assignedGroups = await ProductionGroup.find({
      company: req.user.companyId,
      isActive: true
    }).select('items');
    
    const assignedItemIds = assignedGroups.flatMap(group => 
      group.items.map(item => item.toString())
    );
    console.log('🚫 Total assigned items count:', assignedItemIds.length);

    // Build filter for ungrouped items
    const filter = {
      store: req.user.companyId,
      _id: { $nin: assignedItemIds }
    };

    // Add search filter
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { code: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    console.log('🔍 Filter object:', JSON.stringify(filter, null, 2));

    // Get ungrouped items
    const items = await Item.find(filter)
      .select('name code category subCategory qty unit price image description store')
      .sort({ name: 1 })
      .lean();

    console.log('📦 Retrieved ungrouped item group:', items.length);

    // Format items with proper image URLs and ProductDetailsDailySummary data for item group
    const formattedItems = await Promise.all(items.map(async (item) => {
      const imageUrl = item.image ? (item.image.startsWith('/uploads/data:') ? item.image.replace('/uploads/', '') : item.image) : null;
      
      // Get ProductDailySummary data for qtyPerBatch
      const itemSummary = await ProductDailySummary.findOne({
        productId: item._id,
        companyId: req.user.companyId
      }).lean();

      // Get today's ProductDetailsDailySummary for batchAdjusted
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayDetails = await ProductDetailsDailySummary.findOne({
        productId: item._id,
        companyId: req.user.companyId,
        date: {
          $gte: today,
          $lt: tomorrow
        }
      }).lean();

      return {
        _id: item._id,
        name: item.name || 'Unnamed Item',
        code: item.code || 'No Code',
        category: item.category || 'No Category',
        subCategory: item.subCategory || '',
        qty: item.qty || 0,
        unit: item.unit || '',
        price: item.price || 0,
        description: item.description || '',
        image: imageUrl,
        batchAdjusted: todayDetails?.batchAdjusted || 0,
        qtyPerBatch: itemSummary?.qtyPerBatch || 0
      };
    }));

    // Filter out items with qtyPerBatch = 0 (only return items with available Qty/Batch)
    const availableItems = formattedItems.filter(item => item.qtyPerBatch > 0);
    
    console.log(`📊 Filtered item group: ${formattedItems.length} total → ${availableItems.length} with qtyPerBatch > 0`);

    console.log('📤 Returning ungrouped item group with available Qty/Batch:', {
      total: availableItems.length,
      withImages: availableItems.filter(item => item.image).length,
      assignedItemsCount: assignedItemIds.length,
      totalCompanyItems: totalCompanyItems,
      filteredOut: formattedItems.length - availableItems.length
    });

    res.json({
      success: true,
      data: {
        items: availableItems,
        totalItems: availableItems.length,
        assignedItemsCount: assignedItemIds.length,
        companyItemsCount: totalCompanyItems,
        ungroupedItemsCount: availableItems.length,
        filteredItemsCount: formattedItems.length - availableItems.length
      }
    });
  } catch (error) {
    console.error('Error fetching ungrouped item group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ungrouped item group',
      error: error.message
    });
  }
};

// Get ungrouped item production data for today
export const getUngroupedItemProduction = async (req, res) => {
  try {
    console.log('🔍 Ungrouped Item Production Request:', {
      role: req.user.role,
      username: req.user.username,
      companyId: req.user.companyId,
      query: req.query
    });

    // Validate user and company
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required with valid company'
      });
    }

    const today = new Date().setHours(0, 0, 0, 0);
    console.log('📅 Fetching production data for date:', new Date(today));

    // Get all ungrouped item production records for today
    const productionRecords = await UngroupedItemProduction.find({
      companyId: req.user.companyId,
      productionDate: today
    }).populate('itemId', 'name code category image qtyPerBatch').lean();

    console.log('📊 Found production records:', productionRecords.length);

    // Format the response with batch support
    const formattedRecords = {};
    productionRecords.forEach(record => {
      if (record.itemId) {
        // Always create item key with batch support for consistency
        const itemKey = `ungrouped_${record.itemId._id}_batch_${record.batchNumber || 1}`;
          
        formattedRecords[itemKey] = {
          _id: record._id,
          mouldingTime: record.mouldingTime ? record.mouldingTime.toISOString() : '',
          unloadingTime: record.unloadingTime ? record.unloadingTime.toISOString() : '',
          productionLoss: record.productionLoss || '',
          qtyPerBatch: record.qtyPerBatch || record.itemId.qtyPerBatch || 0,
          qtyAchieved: record.qtyAchieved || 0,
          status: record.status,
          itemId: record.itemId._id,
          batchNumber: record.batchNumber || 1,
          productionDate: record.productionDate
        };
      }
    });

    console.log('📤 Returning production data for items:', Object.keys(formattedRecords).length);

    res.json({
      success: true,
      data: {
        productionRecords: formattedRecords,
        totalRecords: Object.keys(formattedRecords).length,
        productionDate: today
      }
    });
  } catch (error) {
    console.error('Error fetching ungrouped item production data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ungrouped item production data',
      error: error.message
    });
  }
};

// Update ungrouped item production data - Recreated with batchNo as primary identifier
export const updateUngroupedItemProduction = async (req, res) => {
  try {
    console.log('🔄 Update Ungrouped Item Production Request:', req.body);
    console.log('🔄 User Info:', {
      userId: req.user._id,
      username: req.user.username,
      companyId: req.user.companyId
    });

    const { itemId, field, value, batchno } = req.body;

    // Validate required fields
    if (!batchno) {
      return res.status(400).json({
        success: false,
        message: 'batchno is required - this is the primary identifier'
      });
    }

    if (!field) {
      return res.status(400).json({
        success: false,
        message: 'field is required'
      });
    }

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'itemId is required'
      });
    }

    // Set today's production date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(`🔍 Looking for existing record with batchNo: ${batchno} and date: ${today}`);

    // Check if record exists with this batchNo and productionDate (unique combination)
    let productionRecord = await UngroupedItemProduction.findOne({
      companyId: req.user.companyId,
      batchNo: batchno,
      productionDate: today
    });

    if (productionRecord) {
      console.log(`✅ EXISTING record found for batchNo: ${batchno}`);
      console.log(`📋 Record ID: ${productionRecord._id}`);
      console.log(`📋 Current itemId: ${productionRecord.itemId}`);
    } else {
      console.log(`🆕 NO existing record found for batchNo: ${batchno} - CREATING NEW`);
      
      // Extract batch number from batchno format (BATNO01 -> 1)
      const batchNumberMatch = batchno.match(/BATNO(\d+)/);
      const batchNumber = batchNumberMatch ? parseInt(batchNumberMatch[1]) : 1;
      
      // Get item details for default values
      const item = await Item.findById(itemId).select('name code category qtyPerBatch');
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      // Get qtyPerBatch from ProductDailySummary
      const itemSummary = await ProductDailySummary.findOne({
        productId: itemId,
        companyId: req.user.companyId
      }).lean();

      const defaultQtyPerBatch = itemSummary?.qtyPerBatch || 0;

      // Create new production record
      productionRecord = new UngroupedItemProduction({
        companyId: req.user.companyId,
        itemId: itemId,
        batchNo: batchno,
        batchNumber: batchNumber,
        productionDate: today,
        qtyPerBatch: defaultQtyPerBatch,
        createdBy: req.user.username || req.user._id,
        updatedBy: req.user.username || req.user._id
      });
      
      console.log(`🆕 Created new record for batchNo: ${batchno}, itemId: ${itemId}`);
    }

    // Validate and process the field value
    const allowedFields = ['mouldingTime', 'unloadingTime', 'productionLoss', 'qtyPerBatch', 'qtyAchieved'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: `Invalid field. Allowed fields: ${allowedFields.join(', ')}`
      });
    }

    // Process the field value based on type
    let processedValue = value;
    if (field === 'mouldingTime' || field === 'unloadingTime') {
      if (value) {
        processedValue = new Date(value);
        if (isNaN(processedValue.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid datetime format'
          });
        }
      } else {
        processedValue = null;
      }
    } else if (field === 'productionLoss' || field === 'qtyPerBatch' || field === 'qtyAchieved') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) {
        processedValue = 0;
      }
    }

    // Update the field
    productionRecord[field] = processedValue;
    productionRecord.updatedBy = req.user.username || req.user._id;
    productionRecord.updatedAt = new Date();

    console.log(`🔧 Updating field: ${field} with value:`, processedValue);

    // Save the record
    const savedRecord = await productionRecord.save();

    console.log(`✅ Successfully ${savedRecord.isNew === false ? 'UPDATED' : 'CREATED'} record for batchNo: ${batchno}`);
    console.log(`📋 Final Record ID: ${savedRecord._id}`);

    // Return success response
    res.json({
      success: true,
      message: `${field} updated successfully for batch ${batchno}`,
      data: {
        _id: savedRecord._id,
        batchNo: savedRecord.batchNo,
        batchNumber: savedRecord.batchNumber,
        itemId: savedRecord.itemId,
        companyId: savedRecord.companyId,
        productionDate: savedRecord.productionDate,
        mouldingTime: savedRecord.mouldingTime,
        unloadingTime: savedRecord.unloadingTime,
        productionLoss: savedRecord.productionLoss,
        qtyPerBatch: savedRecord.qtyPerBatch,
        qtyAchieved: savedRecord.qtyAchieved,
        status: savedRecord.status,
        updatedField: field,
        updatedValue: processedValue,
        isNewRecord: savedRecord.isNew !== false
      }
    });

  } catch (error) {
    console.error('❌ Error updating ungrouped item production:', error);
    
    // Handle specific database errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry detected',
        error: 'A record with this batchNo and date already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update ungrouped item production',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Helper function to generate batch number in format BATNO01, BATNO02, etc.
const generateBatchNumber = async (itemId, companyId, productionDate) => {
  try {
    // Find the highest batch number for this item, company, and date
    const existingBatches = await UngroupedItemProduction.find({
      itemId: itemId,
      companyId: companyId,
      productionDate: productionDate
    }).sort({ batchNumber: -1 }).limit(1);

    let nextBatchNumber = 1;
    if (existingBatches.length > 0) {
      nextBatchNumber = (existingBatches[0].batchNumber || 0) + 1;
    }

    // Format as BATNO01, BATNO02, etc.
    const batchNo = `BATNO${nextBatchNumber.toString().padStart(2, '0')}`;
    return { batchNo, batchNumber: nextBatchNumber };
  } catch (error) {
    console.error('Error generating batch number:', error);
    return { batchNo: 'BATNO01', batchNumber: 1 };
  }
};

// Create/update ungrouped item production with batch tracking
export const updateUngroupedItemProductionWithBatch = async (req, res) => {
  try {


    console.log('🏭 updateUngroupedItemProductionWithBatch called');
    console.log('Request body:', req.body);
    console.log('User:', { id: req.user._id, role: req.user.role, companyId: req.user.companyId });
    // return false;
    
    const { itemId, field, value, batchno } = req.body;
    const userId = req.user._id.toString();
    const companyId = req.user.companyId;

    // Validate required fields
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'Item ID is required'
      });
    }

    if (!field) {
      return res.status(400).json({
        success: false,
        message: 'Field name is required'
      });
    }

    // Get today's production date
    const today = new Date();
    const productionDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    console.log('📅 Production date:', productionDate.toISOString());

    // batchno is required from frontend
    if (!batchno) {
      return res.status(400).json({
        success: false,
        message: 'batchno is required'
      });
    }

    const finalBatchNo = batchno;
    // Extract number from provided batch no (e.g., BATNO01 -> 1)
    const match = batchno.match(/BATNO(\d+)/);
    const batchNumber = match ? parseInt(match[1]) : 1;
    
    console.log(`📝 Using provided batch number: ${finalBatchNo} (${batchNumber})`);

    // Find or create production record for this item and batch
    let productionRecord = await UngroupedItemProduction.findOne({
      itemId: itemId,
      companyId: companyId,
      productionDate: productionDate,
      batchNo: finalBatchNo
    });

    if (!productionRecord) {
      // Get item details for qtyPerBatch
      const item = await Item.findById(itemId).select('name qty batch');
      const qtyPerBatch = item?.batch ? parseInt(item.batch) : item?.qty || 234; // Default fallback

      console.log('🆕 Creating new production record...');
      productionRecord = new UngroupedItemProduction({
        companyId: companyId,
        itemId: itemId,
        batchNumber: batchNumber,
        qtyPerBatch: qtyPerBatch,
        productionDate: productionDate,
        createdBy: userId,
        notes: `Batch: ${finalBatchNo}`
      });
    }

    // Update the specified field
    const allowedFields = ['mouldingTime', 'unloadingTime', 'productionLoss', 'qtyPerBatch'];
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: `Invalid field. Allowed fields: ${allowedFields.join(', ')}`
      });
    }

    // Set the field value
    if (field === 'mouldingTime' || field === 'unloadingTime') {
      productionRecord[field] = new Date(value);
    } else {
      productionRecord[field] = parseFloat(value) || 0;
    }

    productionRecord.updatedBy = userId;

    // Save the record (pre-save middleware will calculate qtyAchieved and status)
    await productionRecord.save();

    console.log('✅ Production record updated successfully');
    console.log('Updated record:', {
      id: productionRecord._id,
      itemId: productionRecord.itemId,
      batchNo: finalBatchNo,
      batchNumber: productionRecord.batchNumber,
      field: field,
      value: productionRecord[field],
      status: productionRecord.status
    });

    res.json({
      success: true,
      message: 'Ungrouped item production updated successfully',
      data: {
        id: productionRecord._id,
        itemId: productionRecord.itemId,
        companyId: productionRecord.companyId,
        batchNo: finalBatchNo,
        batchNumber: productionRecord.batchNumber,
        mouldingTime: productionRecord.mouldingTime,
        unloadingTime: productionRecord.unloadingTime,
        productionLoss: productionRecord.productionLoss,
        qtyPerBatch: productionRecord.qtyPerBatch,
        qtyAchieved: productionRecord.qtyAchieved,
        status: productionRecord.status,
        productionDate: productionRecord.productionDate,
        updatedField: field,
        updatedValue: productionRecord[field],
        createdAt: productionRecord.createdAt,
        updatedAt: productionRecord.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating ungrouped item production with batch:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A production record for this item and batch already exists for today',
        error: 'Duplicate batch entry'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update ungrouped item production',
      error: error.message
    });
  }
};