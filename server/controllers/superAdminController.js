import User from '../models/User.js';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import { Item } from '../models/Inventory.js';

// Super Admin Dashboard
export const getSuperAdminDashboard = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Super Admin role required'
      });
    }

    console.log('🔍 Fetching Super Admin dashboard data...');

    // Get comprehensive system overview
    const [userStats, orderStats, customerStats, inventoryStats] = await Promise.all([
      // User statistics with role distribution
      User.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            activeUsers: [{ $match: { isActive: true } }, { $count: "count" }],
            byRole: [
              { $group: { _id: "$role", count: { $sum: 1 } } }
            ]
          }
        }
      ]),
      
      // Order statistics with status distribution and revenue
      Order.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            thisMonth: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $count: "count" }
            ],
            statusDistribution: [
              { $group: { _id: "$status", count: { $sum: 1 } } }
            ],
            totalRevenue: [
              { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ],
            monthlyRevenue: [
              {
                $match: {
                  createdAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                }
              },
              { $group: { _id: null, total: { $sum: "$totalAmount" } } }
            ]
          }
        }
      ]),
      
      // Customer statistics
      Customer.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            active: [{ $match: { active: true } }, { $count: "count" }]
          }
        }
      ]),
      
      // Inventory statistics
      Item.aggregate([
        {
          $facet: {
            total: [{ $count: "count" }],
            lowStock: [{ $match: { qty: { $lt: 10 } } }, { $count: "count" }],
            totalValue: [
              { $group: { _id: null, total: { $sum: { $multiply: ["$qty", "$unitPrice"] } } } }
            ]
          }
        }
      ])
    ]);

    // Process and format the aggregated data
    const overview = {
      totalOrders: orderStats[0].total[0]?.count || 0,
      monthlyOrders: orderStats[0].thisMonth[0]?.count || 0,
      totalRevenue: orderStats[0].totalRevenue[0]?.total || 0,
      monthlyRevenue: orderStats[0].monthlyRevenue[0]?.total || 0,
      totalUsers: userStats[0].total[0]?.count || 0,
      activeUsers: userStats[0].activeUsers[0]?.count || 0,
      totalCustomers: customerStats[0].total[0]?.count || 0,
      activeCustomers: customerStats[0].active[0]?.count || 0,
      totalItems: inventoryStats[0].total[0]?.count || 0,
      lowStockItems: inventoryStats[0].lowStock[0]?.count || 0,
      inventoryValue: inventoryStats[0].totalValue[0]?.total || 0
    };

    // Process role distribution
    const roleDistribution = {};
    if (userStats[0].byRole) {
      userStats[0].byRole.forEach(role => {
        roleDistribution[role._id] = role.count;
      });
    }

    // Process order status distribution
    const statusDistribution = {};
    if (orderStats[0].statusDistribution) {
      orderStats[0].statusDistribution.forEach(status => {
        statusDistribution[status._id] = status.count;
      });
    }

    console.log('✅ Super Admin Dashboard data compiled successfully');

    res.status(200).json({
      success: true,
      data: {
        overview,
        roleDistribution,
        statusDistribution,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Super Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Get all users for role management
export const getAllUsers = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Super Admin role required'
      });
    }

    const { page = 1, limit = 20, search, role, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Super Admin role required'
      });
    }

    const { userId } = req.params;
    const { role, permissions } = req.body;

    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user role and permissions
    targetUser.role = role;
    if (permissions) {
      targetUser.permissions = permissions;
    }

    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: {
        user: {
          id: targetUser._id,
          username: targetUser.username,
          role: targetUser.role,
          permissions: targetUser.permissions
        }
      }
    });

  } catch (error) {
    console.error('❌ Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// Get available roles
export const getRoles = async (req, res) => {
  try {
    const roles = [
      'Super Admin',
      'Unit Head',
      'Unit Manager',
      'Sales',
      'Production',
      'Manufacturing',
      'Packing',
      'Dispatch',
      'Accounts'
    ];

    res.status(200).json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error('❌ Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
};

// Get system modules
export const getSystemModules = async (req, res) => {
  try {
    const modules = [
      'Dashboard',
      'Orders',
      'Purchases', 
      'Manufacturing',
      'Production',
      'Dispatches',
      'Sales',
      'Accounts',
      'Inventory',
      'Customers',
      'Suppliers',
      'Companies',
      'Settings',
      'Role Management'
    ];

    res.status(200).json({
      success: true,
      data: modules
    });

  } catch (error) {
    console.error('❌ Get system modules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system modules',
      error: error.message
    });
  }
};

// Super Admin Orders Management
export const getSuperAdminOrders = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Super Admin role required'
      });
    }

    const { page = 1, limit = 20, customerId, salesPersonId, status, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Apply filters
    if (customerId) {
      query.customer = customerId;
    }

    if (salesPersonId) {
      query.salesPerson = salesPersonId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [orders, totalOrders] = await Promise.all([
      Order.find(query)
        .populate({
          path: 'customer',
          select: 'name contactPerson email mobile'
        })
        .populate({
          path: 'salesPerson',
          select: 'username fullName email'
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    // Get summary stats
    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          statusBreakdown: { $push: '$status' }
        }
      }
    ]);

    const summary = stats[0] || { totalAmount: 0, avgOrderValue: 0, statusBreakdown: [] };
    summary.totalOrders = totalOrders;

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalOrders,
          pages: Math.ceil(totalOrders / limit)
        },
        summary
      }
    });

  } catch (error) {
    console.error('❌ Super Admin Orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get Single Order Details
export const getSuperAdminOrderById = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Super Admin role required'
      });
    }

    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('customer', 'name contactPerson email mobile address city')
      .populate('salesPerson', 'username fullName email')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('❌ Super Admin Order detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
};

// Super Admin Sales Management (Sales Persons)
export const getSuperAdminSales = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Super Admin role required'
      });
    }

    const { page = 1, limit = 20, search, sortBy = 'totalOrders', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    let query = { role: 'Sales' };

    // Apply search filter
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get sales persons with their order statistics
    const salesPersons = await User.find(query)
      .select('username fullName email isActive createdAt')
      .lean();

    // Get order statistics for each sales person
    const salesPersonsWithStats = await Promise.all(
      salesPersons.map(async (person) => {
        const orderStats = await Order.aggregate([
          { $match: { salesPerson: person._id } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalAmount: { $sum: '$totalAmount' },
              completedOrders: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              pendingOrders: {
                $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
              },
              avgOrderValue: { $avg: '$totalAmount' },
              lastOrderDate: { $max: '$createdAt' }
            }
          }
        ]);

        const stats = orderStats[0] || {
          totalOrders: 0,
          totalAmount: 0,
          completedOrders: 0,
          pendingOrders: 0,
          avgOrderValue: 0,
          lastOrderDate: null
        };

        return {
          ...person,
          orderStats: stats
        };
      })
    );

    // Apply sorting
    let sortField = 'orderStats.totalOrders';
    if (sortBy === 'totalAmount') sortField = 'orderStats.totalAmount';
    if (sortBy === 'avgOrderValue') sortField = 'orderStats.avgOrderValue';
    if (sortBy === 'fullName') sortField = 'fullName';

    salesPersonsWithStats.sort((a, b) => {
      const aValue = sortField.includes('.') ? sortField.split('.').reduce((obj, key) => obj[key], a) : a[sortField];
      const bValue = sortField.includes('.') ? sortField.split('.').reduce((obj, key) => obj[key], b) : b[sortField];
      
      if (sortOrder === 'asc') {
        return (aValue || 0) - (bValue || 0);
      }
      return (bValue || 0) - (aValue || 0);
    });

    // Apply pagination
    const paginatedSalesPersons = salesPersonsWithStats.slice(skip, skip + parseInt(limit));
    const totalSalesPersons = salesPersonsWithStats.length;

    // Calculate summary statistics
    const summary = {
      totalSalesPersons,
      totalSales: salesPersonsWithStats.reduce((sum, person) => sum + person.orderStats.totalOrders, 0),
      totalAmount: salesPersonsWithStats.reduce((sum, person) => sum + person.orderStats.totalAmount, 0),
      avgSaleValue: salesPersonsWithStats.length > 0 ? 
        salesPersonsWithStats.reduce((sum, person) => sum + person.orderStats.totalAmount, 0) / 
        salesPersonsWithStats.reduce((sum, person) => sum + person.orderStats.totalOrders, 0) : 0
    };

    res.json({
      success: true,
      data: {
        sales: paginatedSalesPersons,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalSalesPersons,
          pages: Math.ceil(totalSalesPersons / limit)
        },
        summary
      }
    });

  } catch (error) {
    console.error('❌ Super Admin Sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales data',
      error: error.message
    });
  }
};

// Get Sales Person Details with Orders
export const getSalesPersonById = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Super Admin role required'
      });
    }

    const { salesPersonId } = req.params;

    // Get sales person details
    const salesPerson = await User.findById(salesPersonId)
      .select('username fullName email isActive createdAt permissions role')
      .lean();

    if (!salesPerson || salesPerson.role !== 'Sales') {
      return res.status(404).json({
        success: false,
        message: 'Sales person not found'
      });
    }

    // Get all orders for this sales person
    const orders = await Order.find({ salesPerson: salesPersonId })
      .populate('customer', 'name contactPerson email mobile')
      .sort({ createdAt: -1 })
      .lean();

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: { salesPerson: salesPerson._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          avgOrderValue: { $avg: '$totalAmount' },
          lastOrderDate: { $max: '$createdAt' }
        }
      }
    ]);

    const stats = orderStats[0] || {
      totalOrders: 0,
      totalAmount: 0,
      completedOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      avgOrderValue: 0,
      lastOrderDate: null
    };

    res.json({
      success: true,
      data: {
        salesPerson,
        orders,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('❌ Sales person details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales person details',
      error: error.message
    });
  }
};

// Super Admin Customers Management
export const getSuperAdminCustomers = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Super Admin role required'
      });
    }

    const { page = 1, limit = 20, search, city, status = 'all', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Apply filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (status !== 'all') {
      query.active = status === 'active';
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [customers, totalCustomers] = await Promise.all([
      Customer.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Customer.countDocuments(query)
    ]);

    // Get customer stats with orders
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orderStats = await Order.aggregate([
          { $match: { customer: customer._id } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalAmount: { $sum: '$totalAmount' },
              lastOrder: { $max: '$createdAt' }
            }
          }
        ]);

        const stats = orderStats[0] || { totalOrders: 0, totalAmount: 0, lastOrder: null };

        return {
          ...customer,
          orderStats: stats
        };
      })
    );

    // Get summary stats
    const summaryStats = await Customer.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: { $cond: [{ $eq: ['$active', true] }, 1, 0] }
          }
        }
      }
    ]);

    const summary = summaryStats[0] || { totalCustomers: 0, activeCustomers: 0 };

    res.json({
      success: true,
      data: {
        customers: customersWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCustomers,
          pages: Math.ceil(totalCustomers / limit)
        },
        summary
      }
    });

  } catch (error) {
    console.error('❌ Super Admin customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

// Get Single Customer Details
export const getSuperAdminCustomerById = async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Super Admin role required'
      });
    }

    const { id } = req.params;

    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer orders
    const orders = await Order.find({ customer: id })
      .populate('salesPerson', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: { customer: customer._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          statusBreakdown: { $push: '$status' }
        }
      }
    ]);

    const stats = orderStats[0] || { totalOrders: 0, totalAmount: 0, avgOrderValue: 0, statusBreakdown: [] };

    res.json({
      success: true,
      data: {
        customer,
        recentOrders: orders,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('❌ Super Admin customer detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details',
      error: error.message
    });
  }
};
