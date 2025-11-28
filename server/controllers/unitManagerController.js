import Order from '../models/Order.js';
import { Item } from '../models/Inventory.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Get items for Unit Manager (inventory access)
export const getItems = async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow Unit Manager role
    if (user.role !== 'Unit Manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Unit Manager role required'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Create base filter to ensure company isolation
    const baseFilter = {
      companyId: user.companyId
    };
    
    // Add unit to filter only if it exists (backward compatibility)
    if (user.unit) {
      baseFilter.unit = user.unit;
    }

    // Build search query
    const searchQuery = { ...baseFilter };
    if (search) {
      searchQuery.$and = [
        baseFilter,
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Get items with pagination
    const [items, totalItems] = await Promise.all([
      Item.find(searchQuery)
        .select('name code category subCategory price stock')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Item.countDocuments(searchQuery)
    ]);

    res.status(200).json({
      success: true,
      items,
      pagination: {
        total: totalItems,
        page,
        pages: Math.ceil(totalItems / limit),
        limit
      }
    });

  } catch (error) {
    console.error('Unit Manager getItems error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch items',
      error: error.message
    });
  }
};

// Update order status (approve/reject/move to production)
export const updateOrderStatus = async (req, res) => {
  try {
    const user = req.user;
    const { id: orderId } = req.params;
    const { status, notes } = req.body;

    // Only allow Unit Manager role
    if (user.role !== 'Unit Manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Unit Manager role required'
      });
    }

    // Validate status
    const allowedStatuses = ['pending', 'approved', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`
      });
    }

    // Create base filter to ensure company isolation
    const baseFilter = {
      companyId: user.companyId
    };
    
    // Add unit to filter only if it exists (backward compatibility)
    if (user.unit) {
      baseFilter.unit = user.unit;
    }

    // Find the order with company isolation
    const order = await Order.findOne({ _id: orderId, ...baseFilter });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not accessible'
      });
    }

    // Update order status and add new history entry without validating existing entries
    const previousStatus = order.status; // Store previous status before updating
    
    const newHistoryEntry = {
      status: status,
      updatedBy: user._id,
      updatedAt: new Date(),
      notes: notes || `Status updated by Unit Manager: ${user.fullName || user.username}`,
      previousStatus: previousStatus
    };

    // Use findByIdAndUpdate to avoid validation issues with existing statusHistory entries
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: { 
          status: status,
          updatedAt: new Date()
        },
        $push: { 
          statusHistory: newHistoryEntry 
        }
      },
      { 
        new: true,
        runValidators: false // Skip validation to avoid issues with existing invalid entries
      }
    );

    res.status(200).json({
      success: true,
      message: `Order ${status} successfully`,
      order: {
        _id: updatedOrder._id,
        orderCode: updatedOrder.orderCode,
        status: updatedOrder.status,
        previousStatus: previousStatus,
        updatedAt: updatedOrder.updatedAt,
        statusHistory: updatedOrder.statusHistory
      }
    });

  } catch (error) {
    console.error('Unit Manager updateOrderStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Utility function to fix orders without salesPerson (run once to fix existing data)
export const fixOrdersSalesPersonAssignment = async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow Unit Manager or Super Admin role for this operation
    if (user.role !== 'Unit Manager' && user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Unit Manager or Super Admin role required'
      });
    }

    // Create base filter to ensure company isolation for Unit Managers
    let findQuery = { salesPerson: { $exists: false } };
    if (user.role === 'Unit Manager') {
      findQuery = {
        ...findQuery,
        companyId: user.companyId
      };
      
      // Add unit to filter only if it exists (backward compatibility)
      if (user.unit) {
        findQuery.unit = user.unit;
      }
    }

    // Find orders without salesPerson
    const ordersWithoutSalesPerson = await Order.find(findQuery);

    console.log('Found orders without salesPerson:', ordersWithoutSalesPerson.length);

    if (ordersWithoutSalesPerson.length === 0) {
      return res.json({
        success: true,
        message: 'No orders found without salesPerson assignment',
        updatedCount: 0
      });
    }

    // For now, we can't automatically assign these to specific users
    // This would need to be done manually or with business logic
    // But we can provide information about them
    const orderCodes = ordersWithoutSalesPerson.map(order => order.orderCode);

    res.json({
      success: true,
      message: `Found ${ordersWithoutSalesPerson.length} orders without salesPerson`,
      orderCodes,
      note: 'These orders need manual salesPerson assignment. New orders will automatically have salesPerson assigned.'
    });

  } catch (error) {
    console.error('Error fixing orders salesPerson assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check orders',
      error: error.message
    });
  }
};

// Get orders for Unit Manager dashboard
export const getOrders = async (req, res) => {
  try {
    console.log('🚀 NEW ENHANCED getOrders FUNCTION CALLED 🚀');
    const user = req.user;
    
    // Only allow Unit Manager role
    if (user.role !== 'Unit Manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Unit Manager role required'
      });
    }

    console.log('=== COMPANY FILTERING ===');
    console.log('User details:', {
      id: user.id,
      username: user.username,
      role: user.role,
      companyId: user.companyId
    });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Increased to get all orders for proper grouping
    const status = req.query.status;

    // Build filter query - company filtering handled through salesPerson
    const filterQuery = {};
    
    if (status && status !== 'all') {
      filterQuery.status = status;
    }

    // Get sales persons from the same company for filtering
    if (user.companyId) {
      // Enhanced debugging - find all users with different filters
      console.log('=== DEBUGGING USER FILTERING ===');
      
      // Check all users in the same company
      const allCompanyUsers = await User.find({ 
        companyId: user.companyId
      }).select('_id username role fullName').lean();
      
      console.log('All users in company:', allCompanyUsers.map(u => ({
        id: u._id,
        username: u.username,
        role: u.role,
        fullName: u.fullName
      })));
      
      // Check specifically for Sales role variations
      const salesUsers = await User.find({ 
        companyId: user.companyId,
        role: { $regex: /sales/i }
      }).select('_id username role fullName').lean();
      
      console.log('Sales users (case insensitive):', salesUsers.map(u => ({
        id: u._id,
        username: u.username,
        role: u.role,
        fullName: u.fullName
      })));
      
      // Use broader role matching for sales
      const companySalesPersons = await User.find({ 
        companyId: user.companyId,
        $or: [
          { role: 'Sales' },
          { role: 'sales' },
          { role: 'Unit Manager' },
          { role: 'Unit Head' },
          { role: { $regex: /sales/i } } // Case insensitive sales role
        ]
      }).select('_id username role fullName').lean();
      
      console.log('Found company sales persons:', companySalesPersons.map(u => ({
        id: u._id,
        username: u.username,
        role: u.role,
        fullName: u.fullName
      })));
      
      const salesPersonIds = companySalesPersons.map(sp => sp._id);
      console.log('Company sales person IDs:', salesPersonIds);
      
      // Filter orders by sales persons from the same company
      filterQuery.salesPerson = { $in: salesPersonIds };
      console.log('Filtering orders by sales persons from companyId:', user.companyId);
    } else {
      console.log('⚠️ WARNING: User has no company assignment - showing all orders');
    }

    console.log('Filter query:', filterQuery);
    
    const [orders, totalOrders] = await Promise.all([
      Order.find(filterQuery)
        .populate('customer', 'name email phone')
        .populate('salesPerson', 'fullName username email role companyId')
        .populate('products.product', 'name code price')
        .sort({ createdAt: -1 })
        .lean(),
      Order.countDocuments(filterQuery)
    ]);

    console.log('=== ENHANCED API PROCESSING ===');
    console.log('Total orders found:', orders.length);
    
    // Debug: Check which sales persons have orders
    const ordersGroupedBySalesPerson = orders.reduce((acc, order) => {
      const spId = order.salesPerson?._id?.toString() || 'unassigned';
      const spName = order.salesPerson?.username || order.salesPerson?.fullName || 'unassigned';
      if (!acc[spId]) {
        acc[spId] = { name: spName, count: 0, orders: [] };
      }
      acc[spId].count++;
      acc[spId].orders.push({
        orderCode: order.orderCode,
        customer: order.customer?.name,
        status: order.status
      });
      return acc;
    }, {});
    
    console.log('Orders grouped by sales person:');
    Object.entries(ordersGroupedBySalesPerson).forEach(([spId, data]) => {
      console.log(`  ${data.name} (${spId}): ${data.count} orders`);
      data.orders.forEach(order => {
        console.log(`    - ${order.orderCode} (${order.customer}) - ${order.status}`);
      });
    });
    
    console.log('Processing product-salesperson-quantity grouping...');

    // Create product-based grouping with salesperson quantities
    const productGrouping = {};
    
    // Process each order to build the product-salesperson structure
    orders.forEach(order => {
      const orderProducts = order.products || [];
      
      orderProducts.forEach(orderProduct => {
        if (!orderProduct.product) return;
        
        const product = orderProduct.product;
        const productKey = product._id.toString();
        const productName = product.name || 'Unknown Product';
        const quantity = orderProduct.quantity || 0;
        
        // Initialize product group if not exists
        if (!productGrouping[productKey]) {
          productGrouping[productKey] = {
            productId: product._id,
            productName: productName,
            productCode: product.code || '',
            totalOrders: 0,
            totalQuantity: 0,
            salesPersons: {}
          };
        }
        
        // Count this order for the product
        productGrouping[productKey].totalOrders += 1;
        productGrouping[productKey].totalQuantity += quantity;
        
        // Handle salesperson data
        if (order.salesPerson && order.salesPerson._id) {
          const salesPersonKey = order.salesPerson._id.toString();
          
          if (!productGrouping[productKey].salesPersons[salesPersonKey]) {
            productGrouping[productKey].salesPersons[salesPersonKey] = {
              _id: order.salesPerson._id,
              fullName: order.salesPerson.fullName || order.salesPerson.username || 'Unknown',
              username: order.salesPerson.username || '',
              email: order.salesPerson.email || '',
              role: order.salesPerson.role || 'Sales',
              totalQuantity: 0,
              orderCount: 0,
              orders: []
            };
          }
          
          productGrouping[productKey].salesPersons[salesPersonKey].totalQuantity += quantity;
          productGrouping[productKey].salesPersons[salesPersonKey].orderCount += 1;
          productGrouping[productKey].salesPersons[salesPersonKey].orders.push({
            orderId: order._id,
            orderCode: order.orderCode,
            quantity: quantity,
            customerName: order.customer?.name || 'Unknown Customer',
            status: order.status,
            orderDate: order.orderDate
          });
        } else {
          // Handle unassigned orders
          if (!productGrouping[productKey].salesPersons['unassigned']) {
            productGrouping[productKey].salesPersons['unassigned'] = {
              _id: 'unassigned',
              fullName: 'Unassigned',
              username: 'unassigned',
              email: null,
              role: null,
              totalQuantity: 0,
              orderCount: 0,
              orders: []
            };
          }
          
          productGrouping[productKey].salesPersons['unassigned'].totalQuantity += quantity;
          productGrouping[productKey].salesPersons['unassigned'].orderCount += 1;
          productGrouping[productKey].salesPersons['unassigned'].orders.push({
            orderId: order._id,
            orderCode: order.orderCode,
            quantity: quantity,
            customerName: order.customer?.name || 'Unknown Customer',
            status: order.status,
            orderDate: order.orderDate
          });
        }
      });
    });

    // Convert to final response format
    const finalData = Object.values(productGrouping).map(productGroup => ({
      productId: productGroup.productId,
      productName: productGroup.productName,
      productCode: productGroup.productCode,
      totalOrders: productGroup.totalOrders,
      totalQuantity: productGroup.totalQuantity,
      salesPersons: Object.values(productGroup.salesPersons)
    }));

    console.log('=== PRODUCT GROUPING SUMMARY ===');
    finalData.forEach(product => {
      console.log(`Product: ${product.productName}`);
      console.log(`  Total Orders: ${product.totalOrders}, Total Quantity: ${product.totalQuantity}`);
      product.salesPersons.forEach(sp => {
        console.log(`    ${sp.fullName} (${sp.username}): ${sp.orderCount} orders, ${sp.totalQuantity} quantity`);
      });
    });
    console.log('=== END PRODUCT GROUPING ===');

    // Enhanced response structure
    res.status(200).json({
      success: true,
      data: finalData,
      metadata: {
        totalProducts: finalData.length,
        totalOrders: orders.length,
        ordersWithSalesPerson: orders.filter(o => o.salesPerson).length,
        ordersWithoutSalesPerson: orders.filter(o => !o.salesPerson).length
      },
      pagination: {
        total: totalOrders,
        page,
        pages: Math.ceil(totalOrders / limit),
        limit
      }
    });

  } catch (error) {
    console.error('Error in Unit Manager getOrders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch orders',
      error: error.message 
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow Unit Manager role
    if (user.role !== 'Unit Manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Unit Manager role required'
      });
    }

    console.log('📊 Dashboard API called for Unit Manager:', user.username);
    console.log('📊 Unit Manager details - Unit:', user.unit, 'CompanyId:', user.companyId);

    // Validate Unit Manager has proper company assignment
    if (!user.companyId) {
      return res.status(400).json({
        success: false,
        message: 'Unit Manager must be assigned to a company. Please contact administrator.',
        debug: { companyId: user.companyId }
      });
    }

    // Create base filter for Unit Manager's company (unit not required)
    const baseFilter = {
      companyId: user.companyId
    };
    
    // Add unit to filter only if it exists (backward compatibility)
    if (user.unit) {
      baseFilter.unit = user.unit;
    }

    console.log('📊 Using filter:', baseFilter);

    const period = req.query.period || 'current-month';
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get comprehensive order statistics with proper status distribution - filtered by Unit Manager's unit and company
    const [orderStats, inventoryStats] = await Promise.all([
      Order.aggregate([
        // Apply base filter to only get orders from Unit Manager's unit/company
        { $match: baseFilter },
        {
          $facet: {
            total: [{ $count: "count" }],
            totalRevenue: [
              { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ],
            thisMonth: [
              { $match: { createdAt: { $gte: startOfMonth, $lte: endOfMonth } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  revenue: { $sum: "$totalAmount" }
                }
              }
            ],
            lastMonth: [
              { $match: { createdAt: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  revenue: { $sum: "$totalAmount" }
                }
              }
            ],
            statusDistribution: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$totalAmount" }
                }
              }
            ],
            pendingOrders: [
              { $match: { status: "pending" } },
              { $count: "count" }
            ],
            approvedOrders: [
              { $match: { status: "approved" } },
              { $count: "count" }
            ],
            inProductionOrders: [
              { $match: { status: "in_production" } },
              { $count: "count" }
            ],
            completedOrders: [
              { $match: { status: "completed" } },
              { $count: "count" }
            ],
            monthlyTrends: [
              {
                $match: {
                  createdAt: { $gte: new Date(today.getFullYear(), today.getMonth() - 5, 1) }
                }
              },
              {
                $group: {
                  _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                  },
                  orderCount: { $sum: 1 },
                  totalRevenue: { $sum: "$totalAmount" }
                }
              },
              {
                $addFields: {
                  avgOrderValue: { $divide: ["$totalRevenue", "$orderCount"] }
                }
              },
              { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]
          }
        }
      ]),
      Item.aggregate([
        // Apply base filter to only get inventory from Unit Manager's unit/company
        { $match: baseFilter },
        {
          $facet: {
            total: [{ $count: "count" }],
            lowStock: [
              { 
                $match: { 
                  $or: [
                    { currentStock: { $lte: 10 } }, 
                    { stock: { $lte: 10 } },
                    { qty: { $lte: 10 } }
                  ] 
                } 
              },
              { 
                $project: { 
                  name: 1, 
                  category: 1, 
                  currentStock: 1, 
                  stock: 1, 
                  qty: 1,
                  minStockLevel: 1,
                  minStock: 1
                } 
              }
            ],
            lowStockCount: [
              { 
                $match: { 
                  $or: [
                    { currentStock: { $lte: 10 } }, 
                    { stock: { $lte: 10 } },
                    { qty: { $lte: 10 } }
                  ] 
                } 
              },
              { $count: "count" }
            ],
            byCategory: [
              {
                $group: {
                  _id: "$category",
                  count: { $sum: 1 },
                  totalValue: { 
                    $sum: { 
                      $multiply: [
                        { 
                          $ifNull: [
                            "$currentStock", 
                            { $ifNull: ["$stock", { $ifNull: ["$qty", 0] }] }
                          ] 
                        }, 
                        { 
                          $ifNull: [
                            "$price", 
                            { $ifNull: ["$salePrice", { $ifNull: ["$purchaseCost", 0] }] }
                          ]
                        }
                      ] 
                    } 
                  }
                }
              },
              { $sort: { totalValue: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ])
    ]);

    // Get sales person performance with more inclusive role matching - filtered by Unit Manager's unit/company
    const salesPersonStats = await User.aggregate([
      { 
        $match: { 
          ...baseFilter, // Add unit/company filtering
          $or: [
            { role: 'Sales' },
            { role: 'sales' },
            { role: 'SALES' },
            { role: 'Sales Person' },
            { role: 'SALESPERSON' },
            { role: 'sales person' },
            { role: { $regex: /sales/i } }
          ]
        } 
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'salesPerson',
          as: 'orders'
        }
      },
      {
        $addFields: {
          totalOrders: { $size: '$orders' },
          totalRevenue: { $sum: '$orders.totalAmount' }
        }
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ['$fullName', '$username'] },
          username: 1,
          email: 1,
          role: 1,
          totalOrders: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Get customer analytics - filtered by Unit Manager's unit/company
    const customerStats = await Order.aggregate([
      // Apply base filter first
      { $match: baseFilter },
      {
        $group: {
          _id: "$customer",
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" },
          lastOrder: { $max: "$createdAt" }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: { path: '$customerInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: {
              $cond: [
                { $gte: ['$lastOrder', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Extract and calculate metrics
    const totalOrders = orderStats[0].total[0]?.count || 0;
    const totalRevenue = orderStats[0].totalRevenue[0]?.total || 0;
    const thisMonthData = orderStats[0].thisMonth[0] || { count: 0, revenue: 0 };
    const lastMonthData = orderStats[0].lastMonth[0] || { count: 0, revenue: 0 };
    
    const orderGrowth = lastMonthData.count > 0 ? 
      ((thisMonthData.count - lastMonthData.count) / lastMonthData.count * 100) : 0;
    
    const revenueGrowth = lastMonthData.revenue > 0 ? 
      ((thisMonthData.revenue - lastMonthData.revenue) / lastMonthData.revenue * 100) : 0;

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Format status distribution 
    const statusDistribution = {};
    if (orderStats[0].statusDistribution && orderStats[0].statusDistribution.length > 0) {
      orderStats[0].statusDistribution.forEach(status => {
        statusDistribution[status._id || 'unknown'] = status.count;
      });
    }

    // Format monthly trends
    const monthlyTrends = orderStats[0].monthlyTrends.map(trend => ({
      year: trend._id.year,
      month: trend._id.month,
      orderCount: trend.orderCount,
      totalRevenue: trend.totalRevenue,
      avgOrderValue: trend.avgOrderValue || 0
    }));

    // Customer analytics
    const customerAnalytics = customerStats[0] || { totalCustomers: 0, activeCustomers: 0 };

    console.log('✅ Dashboard data compiled successfully');
    console.log('📈 Status Distribution:', statusDistribution);
    console.log('👥 Sales Team Found:', salesPersonStats.length, 'sales persons');

    const responseData = {
      success: true,
      data: {
        overview: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          orderGrowth: parseFloat(orderGrowth.toFixed(1)),
          revenueGrowth: parseFloat(revenueGrowth.toFixed(1))
        },
        orders: {
          statusDistribution,
          pendingOrders: orderStats[0].pendingOrders[0]?.count || 0,
          approvedOrders: orderStats[0].approvedOrders[0]?.count || 0,
          inProductionOrders: orderStats[0].inProductionOrders[0]?.count || 0,
          completedOrders: orderStats[0].completedOrders[0]?.count || 0
        },
        inventory: {
          totalItems: inventoryStats[0].total[0]?.count || 0,
          lowStockCount: inventoryStats[0].lowStockCount[0]?.count || 0,
          lowStockItems: inventoryStats[0].lowStock || [],
          byCategory: inventoryStats[0].byCategory || []
        },
        salesPersons: salesPersonStats || [],
        customers: {
          total: customerAnalytics.totalCustomers,
          active: customerAnalytics.activeCustomers,
          growth: 0
        },
        monthlyTrends
      }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Unit Manager getDashboardStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Get sales persons for Unit Manager
export const getSalesPersons = async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow Unit Manager role
    if (user.role !== 'Unit Manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Unit Manager role required'
      });
    }

    console.log('🔍 Unit Manager getSalesPersons - Company filtering enabled');
    console.log('User details:', { 
      username: user.username, 
      companyId: user.companyId, 
      unit: user.unit 
    });

    // Validate Unit Manager has proper company assignment
    if (!user.companyId) {
      return res.status(400).json({
        success: false,
        message: 'Unit Manager must be assigned to a company. Please contact administrator.',
        users: [] // Return empty array
      });
    }

    // Get users with Sales-related roles from the same company only
    const salesPersons = await User.find({ 
      companyId: user.companyId, // Filter by same company
      $or: [
        { role: 'Sales' },
        { role: 'sales' },
        { role: 'Sales Person' },
        { role: 'Sales Manager' },
        { role: 'Sales Managers' },
        { username: { $regex: /sales/i } }
      ],
      isActive: { $ne: false } // Include users where isActive is true or undefined
    })
    .select('_id username email fullName role companyId')
    .sort({ username: 1 })
    .lean();

    console.log(`✅ Found ${salesPersons.length} sales persons from same company`);

    res.status(200).json({
      success: true,
      users: salesPersons
    });

  } catch (error) {
    console.error('Unit Manager getSalesPersons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales persons',
      error: error.message
    });
  }
};

// Get all orders for unit manager
export const getAllOrders = async (req, res) => {
  try {
    const user = req.user;
    
    // Only allow Unit Manager role
    if (user.role !== 'Unit Manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Unit Manager role required'
      });
    }

    console.log('🚀 getAllOrders with company filtering');
    console.log('User details:', {
      id: user.id,
      username: user.username,
      role: user.role,
      companyId: user.companyId
    });

    const { 
      page = 1, 
      limit = 10, 
      status, 
      customerId, 
      salesPersonId,
      dateFrom, 
      dateTo,
      search 
    } = req.query;

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build aggregation pipeline
    const pipeline = [];

    // Lookup customer data
    pipeline.push({
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customer'
      }
    });

    // Lookup salesperson data
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'salesPerson',
        foreignField: '_id',
        as: 'salesPerson'
      }
    });

    // Unwind the arrays (since they should have only one element each)
    pipeline.push({ $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } });
    pipeline.push({ $unwind: { path: '$salesPerson', preserveNullAndEmptyArrays: true } });

    // Build match conditions
    const matchConditions = [];

    // COMPANY FILTERING: Only show orders from sales persons in the same company
    if (user.companyId) {
      const companySalesPersons = await User.find({ 
        companyId: user.companyId,
        role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
      }).select('_id').lean();
      
      const salesPersonIds = companySalesPersons.map(sp => sp._id);
      console.log('Company sales person IDs for filtering:', salesPersonIds.length);
      
      // Filter orders by sales persons from the same company
      matchConditions.push({ 'salesPerson._id': { $in: salesPersonIds } });
      console.log('Applied company-based filtering for companyId:', user.companyId);
    } else {
      console.log('⚠️ WARNING: User has no company assignment - showing all orders');
    }

    // Filter by status
    if (status && status !== 'all') {
      matchConditions.push({ status: status });
    }

    // Filter by customer
    if (customerId && customerId !== 'all') {
      try {
        const customerObjectId = new mongoose.Types.ObjectId(customerId);
        matchConditions.push({ 'customer._id': customerObjectId });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid customer ID format'
        });
      }
    }

    // Filter by salesperson
    if (salesPersonId && salesPersonId !== 'all') {
      try {
        const salespersonObjectId = new mongoose.Types.ObjectId(salesPersonId);
        matchConditions.push({ 'salesPerson._id': salespersonObjectId });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid salesperson ID format'
        });
      }
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      const dateFilter = {};
      if (dateFrom) {
        dateFilter.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        dateFilter.$lte = new Date(dateTo + 'T23:59:59.999Z');
      }
      matchConditions.push({ createdAt: dateFilter });
    }

    // Filter by search
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      matchConditions.push({
        $or: [
          { orderCode: searchRegex },
          { 'customer.name': searchRegex },
          { 'customer.email': searchRegex },
          { 'salesPerson.fullName': searchRegex },
          { 'salesPerson.username': searchRegex }
        ]
      });
    }

    // Add match stage if there are conditions
    if (matchConditions.length > 0) {
      pipeline.push({ $match: { $and: matchConditions } });
    }

    // Get total count for pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Order.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;

    // Add sorting, skip and limit for main query
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Execute main query
    const orders = await Order.aggregate(pipeline);

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Calculate summary statistics using the same base conditions
    const summaryPipeline = [];
    
    // Add lookups for summary as well
    summaryPipeline.push({
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customer'
      }
    });
    
    summaryPipeline.push({
      $lookup: {
        from: 'users',
        localField: 'salesPerson',
        foreignField: '_id',
        as: 'salesPerson'
      }
    });

    summaryPipeline.push({ $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } });
    summaryPipeline.push({ $unwind: { path: '$salesPerson', preserveNullAndEmptyArrays: true } });

    // Apply same filters for summary
    if (matchConditions.length > 0) {
      summaryPipeline.push({ $match: { $and: matchConditions } });
    }

    // Group by status for summary
    summaryPipeline.push({
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    });

    const statusCounts = await Order.aggregate(summaryPipeline);

    const summary = {
      total: totalCount,
      pending: statusCounts.find(s => s._id === 'pending')?.count || 0,
      approved: statusCounts.find(s => s._id === 'approved')?.count || 0,
      rejected: statusCounts.find(s => s._id === 'rejected')?.count || 0,
      disapproved: statusCounts.find(s => s._id === 'disapproved')?.count || 0,
      in_production: statusCounts.find(s => s._id === 'in_production')?.count || 0,
      completed: statusCounts.find(s => s._id === 'completed')?.count || 0,
      cancelled: statusCounts.find(s => s._id === 'cancelled')?.count || 0
    };

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        summary
      }
    });

  } catch (error) {
    console.error('Error fetching orders for unit manager:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get single order details
export const getOrderById = async (req, res) => {
  try {
    const user = req.user;
    const { id: orderId } = req.params;
    
    // Only allow Unit Manager role
    if (user.role !== 'Unit Manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Unit Manager role required'
      });
    }

    // Create base filter to ensure company isolation
    const baseFilter = {
      companyId: user.companyId
    };
    
    // Add unit to filter only if it exists (backward compatibility)
    if (user.unit) {
      baseFilter.unit = user.unit;
    }

    const order = await Order.findOne({ _id: orderId, ...baseFilter })
      .populate('customer', 'name email phone address city state pincode')
      .populate('salesPerson', 'fullName email phone')
      .populate('products.product', 'name code category subCategory brand specifications')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not accessible'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
};
