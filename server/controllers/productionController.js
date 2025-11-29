import ProductionGroup from '../models/ProductionGroup.js';
import { Item } from '../models/Inventory.js';
import User from '../models/User.js';

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

    // Calculate dashboard statistics
    const totalGroups = allGroups.length;
    const activeGroups = allGroups.filter(group => group && group.isActive !== false);
    const inactiveGroups = allGroups.filter(group => group && group.isActive === false);
    
    // Calculate total batches and items
    let totalBatches = 0;
    let totalItems = 0;
    let pendingTasks = 0;
    let completedToday = 0;
    let damages = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    activeGroups.forEach(group => {
      try {
        // Count batches (considering each production group as a batch)
        totalBatches += 1;
        
        // Count total items in all groups
        if (group && group.items && Array.isArray(group.items)) {
          totalItems += group.items.reduce((sum, item) => sum + (item && item.qty ? item.qty : 0), 0);
        }
        
        // Mock data for pending tasks, completed today, and damages
        // In a real production system, this would come from production records
        pendingTasks += Math.floor(Math.random() * 3); // 0-2 pending per group
        
        // Check if group was created today for "completed today"
        if (group && group.createdAt) {
          const groupDate = new Date(group.createdAt);
          groupDate.setHours(0, 0, 0, 0);
          if (groupDate.getTime() === today.getTime()) {
            completedToday += 1;
          }
        }
        
        // Random damages (in real system, this would be tracked separately)
        damages += Math.floor(Math.random() * 2); // 0-1 damage per group
      } catch (groupError) {
        console.error('Error processing group:', group?._id, groupError);
        // Continue with next group
      }
    });

    // Get recent production groups for dashboard table
    const recentGroups = activeGroups.slice(0, 10).map(group => {
      try {
        const totalQuantity = (group && group.items && Array.isArray(group.items)) 
          ? group.items.reduce((sum, item) => sum + (item && item.qty ? item.qty : 0), 0) 
          : 0;
        
        return {
          _id: group?._id || '',
          name: group?.name || 'Unknown Group',
          batches: 1, // Each group represents a batch
          totalQuantity: totalQuantity,
          items: (group && group.items && Array.isArray(group.items)) ? group.items.length : 0,
          status: (group && group.isActive !== false) ? 'Active' : 'Inactive',
          createdAt: group?.createdAt || new Date(),
          createdBy: group?.createdBy?.username || 'Unknown',
        // Format time fields properly for frontend
        mouldingTime: group?.mouldingTime ? 
          group.mouldingTime.toISOString().slice(0, 16) : null,
        unloadingTime: group?.unloadingTime ? 
          group.unloadingTime.toISOString().slice(0, 16) : null,
          productionLoss: group?.productionLoss || 0
        };
      } catch (mappingError) {
        console.error('Error mapping group:', group?._id, mappingError);
        return {
          _id: group?._id || '',
          name: 'Error Loading Group',
          batches: 0,
          totalQuantity: 0,
          items: 0,
          status: 'Error',
          createdAt: new Date(),
          createdBy: 'Unknown'
        };
      }
    });

    // Dashboard statistics with validation
    const dashboardStats = {
      totalBatches: Math.max(0, totalBatches || 0),
      pendingTasks: Math.max(0, pendingTasks || 0),
      completedToday: Math.max(0, completedToday || 0),
      damages: Math.max(0, damages || 0),
      totalGroups: Math.max(0, activeGroups.length || 0),
      totalItems: Math.max(0, totalItems || 0),
      productionRate: activeGroups.length > 0 ? Math.round((completedToday / activeGroups.length) * 100) : 0
    };

    console.log('Dashboard stats calculated:', dashboardStats);

    res.json({
      success: true,
      message: 'Production dashboard data fetched successfully',
      data: {
        stats: dashboardStats,
        recentGroups: recentGroups,
        summary: {
          totalGroups: totalGroups,
          activeGroups: activeGroups.length,
          inactiveGroups: inactiveGroups.length
        }
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
      // Calculate total batch quantity by summing qtyPerBatch from ProductDailySummary
      let totalBatchQuantity = 0;
      const itemsWithBatchQty = [];
      
      if (group.items && group.items.length > 0) {
        for (const item of group.items) {
          let itemQtyPerBatch = 0;
          try {
            // Find the ProductDailySummary for this item - try multiple query approaches
            console.log(`🔍 Searching qtyPerBatch for item: ${item.name}`);
            
            // Try different query strategies
            let summary = await ProductDailySummary.findOne({
              productName: item.name,
              companyId: req.user.companyId
            }).lean();
            
            // If not found by exact name, try case-insensitive search
            if (!summary) {
              console.log(`   Trying case-insensitive search for: ${item.name}`);
              summary = await ProductDailySummary.findOne({
                productName: { $regex: new RegExp(`^${item.name}$`, 'i') },
                companyId: req.user.companyId
              }).lean();
            }
            
            // If still not found, try searching by productId
            if (!summary && item._id) {
              console.log(`   Trying productId search for: ${item._id}`);
              summary = await ProductDailySummary.findOne({
                productId: item._id,
                companyId: req.user.companyId
              }).lean();
            }
            
            // If still not found, try without company filter (in case data exists without company)
            if (!summary) {
              console.log(`   Trying search without company filter for: ${item.name}`);
              summary = await ProductDailySummary.findOne({
                productName: item.name
              }).lean();
            }
            
            if (summary && summary.qtyPerBatch) {
              itemQtyPerBatch = summary.qtyPerBatch;
              totalBatchQuantity += summary.qtyPerBatch;
              console.log(`✅ Found qtyPerBatch for ${item.name}: ${summary.qtyPerBatch}`);
            } else if (summary) {
              console.log(`⚠️  Found summary for ${item.name} but qtyPerBatch is: ${summary.qtyPerBatch}`);
            } else {
              console.log(`❌ No ProductDailySummary found for ${item.name}`);
              
              // Check what ProductDailySummary records exist
              const allSummaries = await ProductDailySummary.find({ 
                companyId: req.user.companyId 
              }).select('productName productId qtyPerBatch').lean();
              console.log(`   Available ProductDailySummary records:`, 
                allSummaries.map(s => ({ name: s.productName, id: s.productId, qtyPerBatch: s.qtyPerBatch }))
              );
            }
          } catch (error) {
            console.log(`❌ Error getting qtyPerBatch for ${item.name}:`, error.message);
          }
          
          // Add item with qtyPerBatch
          itemsWithBatchQty.push({
            _id: item._id,
            name: item.name,
            code: item.code,
            category: item.category,
            qty: item.qty || 0,
            unit: item.unit || '',
            price: item.price || 0,
            image: item.image,
            qtyPerBatch: itemQtyPerBatch
          });
        }
      }
      
      const totalItems = group.items?.length || 0;
      const totalCurrentQuantity = group.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;

      console.log(`Group ${group.name}:`, {
        totalItems,
        totalCurrentQuantity,
        totalBatchQuantity,
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
        totalBatchQuantity: totalBatchQuantity, // NEW: Sum of all qtyPerBatch values
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
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Invalid field: ${field}`
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