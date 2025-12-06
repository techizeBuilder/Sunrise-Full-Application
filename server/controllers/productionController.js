import ProductionGroup from '../models/ProductionGroup.js';
import ProductDailySummary from '../models/ProductDailySummary.js';
import { Item } from '../models/Inventory.js';
import User from '../models/User.js';
import UngroupedItemProduction from '../models/UngroupedItemProduction.js';

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
        
        // Query ProductDailySummary for all items in this group - ONLY APPROVED ONES
        const summaryQuery = {
          productId: { $in: itemIds },
          status: 'approved'  // Only get approved ProductDailySummary records
        };
        
        // Add company filter if user has company
        if (req.user.companyId) {
          summaryQuery.companyId = req.user.companyId;
        }
        
        const productSummaries = await ProductDailySummary.find(summaryQuery);
        
        // Calculate total batchAdjusted for all items in this group
        const totalBatches = productSummaries.reduce((total, summary) => {
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

      return {
        _id: group._id,
        name: group.name,
        description: group.description || '',
        totalItems: totalItems,
        totalQuantity: totalCurrentQuantity, // Keep for backward compatibility
        // Batch quantity fields from ProductionGroup model
        qtyPerBatch: groupQtyPerBatch,
        qtyAchievedPerBatch: groupQtyAchievedPerBatch,
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
    const groupId = req.params.groupId || req.body.groupId;
    const { field, value, timingData } = req.body;
    
    console.log('⏱️ Updating production shift timing for group:', groupId);
    console.log('Field:', field, 'Value:', value);
    
    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
    }

    let query = { _id: groupId };

    // COMPANY FILTERING: Only allow updates for same company groups
    if (req.user.companyId) {
      query.company = req.user.companyId;
    }

    const group = await ProductionGroup.findOne(query);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Production group not found'
      });
    }

    // Handle auto-save field updates
    if (field && value !== undefined) {
      const updateData = {};
      
      switch (field) {
        case 'mouldingTime':
          // Frontend sends ISO string or null
          updateData.mouldingTime = value ? new Date(value) : null;
          break;
        case 'unloadingTime':
          // Frontend sends ISO string or null
          updateData.unloadingTime = value ? new Date(value) : null;
          break;
        case 'productionLoss':
          updateData.productionLoss = parseFloat(value) || 0;
          
          // Auto-calculate qtyAchievedPerBatch when production loss changes
          // First get the current production group to access qtyPerBatch
          const currentGroup = await ProductionGroup.findOne(query);
          if (currentGroup) {
            const qtyPerBatch = currentGroup.qtyPerBatch || 0;
            const productionLoss = updateData.productionLoss;
            // Calculate: qtyAchievedPerBatch = qtyPerBatch - productionLoss (minimum 0)
            updateData.qtyAchievedPerBatch = Math.max(0, qtyPerBatch - productionLoss);
            
            console.log('🧮 Auto-calculating qtyAchievedPerBatch:', {
              qtyPerBatch: qtyPerBatch,
              productionLoss: productionLoss,
              calculatedAchieved: updateData.qtyAchievedPerBatch
            });
          }
          break;
        case 'qtyPerBatch':
          // Handle quantity per batch updates
          updateData.qtyPerBatch = parseFloat(value) || 0;
          if (updateData.qtyPerBatch < 0) {
            return res.status(400).json({
              success: false,
              message: 'Quantity per batch cannot be negative'
            });
          }
          
          // Auto-calculate qtyAchievedPerBatch when qtyPerBatch changes
          // First get the current production group to access productionLoss
          const currentGroupForQty = await ProductionGroup.findOne(query);
          if (currentGroupForQty) {
            const productionLoss = currentGroupForQty.productionLoss || 0;
            const qtyPerBatch = updateData.qtyPerBatch;
            // Calculate: qtyAchievedPerBatch = qtyPerBatch - productionLoss (minimum 0)
            updateData.qtyAchievedPerBatch = Math.max(0, qtyPerBatch - productionLoss);
            
            console.log('🧮 Auto-calculating qtyAchievedPerBatch for qtyPerBatch change:', {
              qtyPerBatch: qtyPerBatch,
              productionLoss: productionLoss,
              calculatedAchieved: updateData.qtyAchievedPerBatch
            });
          }
          break;
        case 'qtyAchievedPerBatch':
          // Handle achieved quantity per batch updates
          updateData.qtyAchievedPerBatch = parseFloat(value) || 0;
          if (updateData.qtyAchievedPerBatch < 0) {
            return res.status(400).json({
              success: false,
              message: 'Achieved quantity per batch cannot be negative'
            });
          }
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Invalid field: ${field}. Allowed fields: mouldingTime, unloadingTime, productionLoss, qtyPerBatch, qtyAchievedPerBatch`
          });
      }

      // Update the production group
      await ProductionGroup.findOneAndUpdate(query, updateData, { new: true });

      return res.json({
        success: true,
        message: `${field} updated successfully`,
        data: {
          groupId: groupId,
          field: field,
          value: value,
          updatedAt: new Date()
        }
      });
    }

    // Handle bulk timing data updates (legacy)
    if (timingData) {
      res.json({
        success: true,
        message: 'Production shift timing updated successfully',
        data: {
          groupId: groupId,
          updatedAt: new Date(),
          timingData: timingData
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either field/value or timingData is required'
      });
    }

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
      
      // Get ProductDailySummary data for this specific item - ONLY APPROVED ONES
      const itemSummary = await ProductDailySummary.findOne({
        productId: item._id,
        companyId: req.user.companyId,
        status: 'approved'  // Only get approved ProductDailySummary records
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
        batchAdjusted: itemSummary?.batchAdjusted || 0,
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

    // Format items with proper image URLs and ProductDailySummary data
    const formattedItems = await Promise.all(items.map(async (item) => {
      const imageUrl = item.image ? (item.image.startsWith('/uploads/data:') ? item.image.replace('/uploads/', '') : item.image) : null;
      
      // Get ProductDailySummary data for this specific item - ONLY APPROVED ONES
      const itemSummary = await ProductDailySummary.findOne({
        productId: item._id,
        companyId: req.user.companyId,
        status: 'approved'  // Only get approved ProductDailySummary records
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
        batchAdjusted: itemSummary?.batchAdjusted || 0,
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

    // Format the response
    const formattedRecords = {};
    productionRecords.forEach(record => {
      if (record.itemId) {
        const itemKey = `ungrouped_${record.itemId._id}`;
        formattedRecords[itemKey] = {
          _id: record._id,
          mouldingTime: record.mouldingTime ? record.mouldingTime.toISOString() : '',
          unloadingTime: record.unloadingTime ? record.unloadingTime.toISOString() : '',
          productionLoss: record.productionLoss || '',
          qtyPerBatch: record.qtyPerBatch || record.itemId.qtyPerBatch || 0,
          qtyAchieved: record.qtyAchieved || 0,
          status: record.status,
          itemId: record.itemId._id,
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

// Update ungrouped item production data
export const updateUngroupedItemProduction = async (req, res) => {
  try {
    console.log('🔄 Update Ungrouped Item Production Request:', {
      role: req.user.role,
      username: req.user.username,
      companyId: req.user.companyId,
      body: req.body
    });

    // Validate user and company
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required with valid company'
      });
    }

    const { itemId, field, value } = req.body;

    // Validate required fields
    if (!itemId || !field) {
      return res.status(400).json({
        success: false,
        message: 'Item ID and field are required'
      });
    }

    console.log('📝 Update details:', { itemId, field, value });

    // Get or create production record for today
    const productionRecord = await UngroupedItemProduction.getOrCreateTodayRecord(
      req.user.companyId,
      itemId,
      req.user.username
    );

    console.log('📄 Found/Created production record:', productionRecord._id);

    // Update the specific field
    let processedValue = value;
    
    // Handle datetime fields
    if (field === 'mouldingTime' || field === 'unloadingTime') {
      if (value && value.trim() !== '') {
        processedValue = new Date(value);
        console.log(`🕰️ Processed datetime ${field}:`, processedValue);
      } else {
        processedValue = null;
        console.log(`🕰️ Setting ${field} to null`);
      }
    }
    
    // Handle numeric fields
    if (field === 'productionLoss' || field === 'qtyPerBatch') {
      processedValue = parseFloat(value) || 0;
      console.log(`🔢 Processed numeric ${field}:`, processedValue);
    }

    // Update the field
    productionRecord[field] = processedValue;
    productionRecord.updatedBy = req.user.username;

    // Save the record (this will trigger the pre-save middleware to calculate qtyAchieved)
    await productionRecord.save();

    console.log('✅ Successfully updated production record:', {
      field,
      value: processedValue,
      qtyAchieved: productionRecord.qtyAchieved,
      status: productionRecord.status
    });

    res.json({
      success: true,
      message: `${field} updated successfully`,
      data: {
        _id: productionRecord._id,
        [field]: processedValue,
        qtyAchieved: productionRecord.qtyAchieved,
        status: productionRecord.status,
        updatedAt: productionRecord.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating ungrouped item production:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ungrouped item production',
      error: error.message
    });
  }
};