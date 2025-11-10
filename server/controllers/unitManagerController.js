import Order from '../models/Order.js';
import { Item } from '../models/Inventory.js';
import User from '../models/User.js';

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

    // Build search query
    const searchQuery = {};
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
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
    const allowedStatuses = ['pending', 'approved', 'rejected', 'in_production'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update order status
    const previousStatus = order.status;
    order.status = status;
    order.updatedAt = new Date();
    
    // Add status history entry
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    
    order.statusHistory.push({
      status: status,
      updatedBy: user._id,
      updatedAt: new Date(),
      notes: notes || `Status updated by Unit Manager: ${user.fullName || user.username}`,
      previousStatus: previousStatus
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order ${status} successfully`,
      order: {
        _id: order._id,
        orderCode: order.orderCode,
        status: order.status,
        previousStatus: previousStatus,
        updatedAt: order.updatedAt
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
    
    // Only allow Unit Manager or Super User role for this operation
    if (user.role !== 'Unit Manager' && user.role !== 'Super User') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Unit Manager or Super User role required'
      });
    }

    // Find orders without salesPerson
    const ordersWithoutSalesPerson = await Order.find({
      salesPerson: { $exists: false }
    });

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

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Increased to get all orders for proper grouping
    const status = req.query.status;

    // Build filter query
    const filterQuery = {};
    if (status && status !== 'all') {
      filterQuery.status = status;
    }

    // Get all orders with populated references for complete analysis
    const [orders, totalOrders] = await Promise.all([
      Order.find(filterQuery)
        .populate('customer', 'name email phone')
        .populate('salesPerson', 'fullName username email role')
        .populate('products.product', 'name code price')
        .sort({ createdAt: -1 })
        .lean(),
      Order.countDocuments(filterQuery)
    ]);

    console.log('=== ENHANCED API PROCESSING ===');
    console.log('Total orders found:', orders.length);
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

    console.log('📊 Dashboard API called for period:', req.query.period || 'current-month');

    const period = req.query.period || 'current-month';
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // Get comprehensive order statistics with proper status distribution
    const [orderStats, inventoryStats] = await Promise.all([
      Order.aggregate([
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

    // Get sales person performance with more inclusive role matching
    const salesPersonStats = await User.aggregate([
      { 
        $match: { 
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

    // Get customer analytics
    const customerStats = await Order.aggregate([
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

    // Get users with Sales-related roles (check multiple variations)
    const allUsers = await User.find({}).select('_id username email fullName role').lean();
    console.log('All users in database:', allUsers);

    const salesPersons = await User.find({ 
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
    .select('_id username email fullName role')
    .sort({ username: 1 })
    .lean();

    console.log('Unit Manager getSalesPersons - Found sales users:', salesPersons);

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

    const { 
      page = 1, 
      limit = 10, 
      status, 
      customerId, 
      dateFrom, 
      dateTo,
      search 
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Filter by status if provided
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filter by customer if provided
    if (customerId) {
      filter.customer = customerId;
    }

    // Filter by date range if provided
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { orderCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with populated customer and salesperson data
    const orders = await Order.find(filter)
      .populate('customer', 'name email phone address')
      .populate('salesPerson', 'fullName email')
      .populate('products.product', 'name code category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Calculate summary statistics
    const statusCounts = await Order.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const summary = {
      total: totalCount,
      pending: statusCounts.find(s => s._id === 'Pending')?.count || 0,
      approved: statusCounts.find(s => s._id === 'Approved')?.count || 0,
      disapproved: statusCounts.find(s => s._id === 'Disapproved')?.count || 0,
      in_production: statusCounts.find(s => s._id === 'In_Production')?.count || 0,
      completed: statusCounts.find(s => s._id === 'Completed')?.count || 0,
      cancelled: statusCounts.find(s => s._id === 'Cancelled')?.count || 0
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

    const order = await Order.findById(orderId)
      .populate('customer', 'name email phone address city state pincode')
      .populate('salesPerson', 'fullName email phone')
      .populate('products.product', 'name code category subCategory brand specifications')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
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
