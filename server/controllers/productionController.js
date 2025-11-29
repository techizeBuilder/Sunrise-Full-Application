import ProductionGroup from '../models/ProductionGroup.js';
import ProductDailySummary from '../models/ProductDailySummary.js';
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
        
        // Query ProductDailySummary for all items in this group
        let summaryQuery = {
          productId: { $in: itemIds }
        };
        
        // Add company filter if user has company
        if (req.user.companyId) {
          summaryQuery.companyId = req.user.companyId;
        }
        
        const productSummaries = await ProductDailySummary.find(summaryQuery);
        
        // Calculate total productionFinalBatches for all items in this group
        const totalBatches = productSummaries.reduce((total, summary) => {
          return total + (summary.productionFinalBatches || 0);
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