import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import { Item } from '../models/Inventory.js';
import User from '../models/User.js';
import { USER_ROLES } from '../../shared/schema.js';

// Unit Head Orders Management
export const getUnitHeadOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerId, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    // Debug logging
    console.log('Unit Head Orders Request Params:', req.query);
    console.log('User:', req.user?.username, 'Role:', req.user?.role);

    let query = {};

    // Unit Head can see all orders if they have canAccessAllUnits permission, otherwise only their unit
    if (req.user.role !== USER_ROLES.SUPER_USER && !req.user.permissions?.canAccessAllUnits) {
      query.unit = req.user.unit;
    }

    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }

    if (customerId) {
      query.customer = customerId;
    }

    if (search) {
      query.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate && endDate) {
      query.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.orderDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.orderDate = { $lte: new Date(endDate) };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Debug final query
    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));
    console.log('Sort:', sort);

    const orders = await Order.find(query)
      .populate({
        path: 'customer',
        select: 'name contactPerson email mobile address city active'
      })
      .populate({
        path: 'salesPerson',
        select: 'username email role'
      })
      .populate({
        path: 'products.product',
        select: 'name code category subCategory price'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    // Calculate totals for dashboard
    const totalValue = await Order.aggregate([
      { $match: query },
      { $unwind: '$products' },
      { $group: { _id: null, total: { $sum: { $multiply: ['$products.quantity', '$products.price'] } } } }
    ]);

    // Get status counts
    const statusCounts = await Order.aggregate([
      { $match: { ...query } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          totalValue: totalValue[0]?.total || 0,
          statusCounts: statusCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      }
    });
  } catch (error) {
    console.error('Unit Head get orders error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders', 
      error: error.message 
    });
  }
};

// Get single order details for Unit Head
export const getUnitHeadOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id };

    // Unit Head can see orders based on their permissions
    if (req.user.role !== USER_ROLES.SUPER_USER && !req.user.permissions?.canAccessAllUnits) {
      query.unit = req.user.unit;
    }

    const order = await Order.findOne(query)
      .populate({
        path: 'customer',
        select: 'name contactPerson email mobile address city active'
      })
      .populate({
        path: 'salesPerson',
        select: 'username email role'
      })
      .populate({
        path: 'products.product',
        select: 'name code category subCategory price'
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Unit Head get order by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order details', 
      error: error.message 
    });
  }
};

// Unit Head Sales Management  
export const getUnitHeadSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, paymentStatus, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    // Since there might not be sales records, let's show order-based data as "sales"
    let orderQuery = {};
    
    // Unit Head can see orders based on their permissions
    if (req.user.role !== USER_ROLES.SUPER_USER && !req.user.permissions?.canAccessAllUnits) {
      orderQuery.unit = req.user.unit;
    }

    // Apply filters for orders (adapt sales filters to order filters)
    if (search) {
      orderQuery.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter for orders
    if (startDate && endDate) {
      orderQuery.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      orderQuery.orderDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      orderQuery.orderDate = { $lte: new Date(endDate) };
    }

    // Build sort object for orders
    const sort = {};
    const orderSortBy = sortBy === 'createdAt' ? 'orderDate' : sortBy;
    sort[orderSortBy] = sortOrder === 'asc' ? 1 : -1;

    const orders = await Order.find(orderQuery)
      .populate({
        path: 'customer',
        select: 'name contactPerson email mobile address city active'
      })
      .populate({
        path: 'salesPerson',
        select: 'username email role'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(orderQuery);

    // Transform orders to look like sales for frontend compatibility
    const salesLikeOrders = orders.map(order => ({
      _id: order._id,
      invoiceNumber: order.orderNumber, // Use order number as invoice number
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        salesPerson: order.salesPerson
      },
      customer: order.customer,
      totalAmount: order.totalAmount,
      paymentStatus: order.status === 'delivered' ? 'Paid' : 'Pending', // Map status to payment status
      createdAt: order.orderDate,
      dispatch: null // Orders might not have dispatch yet
    }));

    // Calculate revenue totals from orders
    const revenue = await Order.aggregate([
      { $match: orderQuery },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$totalAmount' },
          paidAmount: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'delivered'] }, '$totalAmount', 0] 
            }
          },
          pendingAmount: { 
            $sum: { 
              $cond: [{ $ne: ['$status', 'delivered'] }, '$totalAmount', 0] 
            }
          }
        }
      }
    ]);

    // Get status counts from orders and map to payment status
    const statusCounts = await Order.aggregate([
      { $match: orderQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const paymentStatusCounts = {};
    statusCounts.forEach(item => {
      if (item._id === 'delivered') {
        paymentStatusCounts['Paid'] = item.count;
      } else {
        paymentStatusCounts['Pending'] = (paymentStatusCounts['Pending'] || 0) + item.count;
      }
    });

    res.json({
      success: true,
      data: {
        sales: salesLikeOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          totalRevenue: revenue[0]?.totalRevenue || 0,
          paidAmount: revenue[0]?.paidAmount || 0,
          pendingAmount: revenue[0]?.pendingAmount || 0,
          paymentStatusCounts
        },
        isOrderBased: true // Flag to indicate this is order-based data
      }
    });
  } catch (error) {
    console.error('Unit Head get sales error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sales', 
      error: error.message 
    });
  }
};

// Unit Head Customers Management
export const getUnitHeadCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, city, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Unit Head can see customers based on their permissions
    if (req.user.role !== USER_ROLES.SUPER_USER && !req.user.permissions?.canAccessAllUnits) {
      query.unit = req.user.unit;
    }

    // Apply filters
    if (status && status !== 'all') {
      query.active = status === 'active' ? 'Yes' : 'No';
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const customers = await Customer.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    // Get customer statistics
    const customerStats = await Customer.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          activeCustomers: { $sum: { $cond: [{ $eq: ['$active', 'Yes'] }, 1, 0] } },
          inactiveCustomers: { $sum: { $cond: [{ $eq: ['$active', 'No'] }, 1, 0] } },
          totalCustomers: { $sum: 1 }
        }
      }
    ]);

    // Get city distribution
    const cityDistribution = await Customer.aggregate([
      { $match: query },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          activeCustomers: customerStats[0]?.activeCustomers || 0,
          inactiveCustomers: customerStats[0]?.inactiveCustomers || 0,
          totalCustomers: customerStats[0]?.totalCustomers || 0,
          cityDistribution
        }
      }
    });
  } catch (error) {
    console.error('Unit Head get customers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch customers', 
      error: error.message 
    });
  }
};

// Get single customer details for Unit Head
export const getUnitHeadCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id };

    // Unit Head can see customers based on their permissions
    if (req.user.role !== USER_ROLES.SUPER_USER && !req.user.permissions?.canAccessAllUnits) {
      query.unit = req.user.unit;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or access denied'
      });
    }

    // Get customer's order history
    const orderHistory = await Order.find({ customer: id })
      .select('orderCode orderNumber orderDate status totalAmount')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get customer's sales history
    const salesHistory = await Sale.find({ customer: id })
      .select('invoiceNumber totalAmount paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        customer,
        orderHistory,
        salesHistory
      }
    });
  } catch (error) {
    console.error('Unit Head get customer by ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch customer details', 
      error: error.message 
    });
  }
};

// Unit Head Dashboard Overview
export const getUnitHeadDashboard = async (req, res) => {
  try {
    let query = {};
    const { period = 'current-month' } = req.query;

    // Unit Head can see data based on their permissions
    if (req.user.role !== USER_ROLES.SUPER_USER && !req.user.permissions?.canAccessAllUnits) {
      query.unit = req.user.unit;
    }

    // Helper function to get date ranges based on period
    const getDateRange = (period) => {
      const today = new Date();
      let startDate, endDate, compareStartDate, compareEndDate;

      switch (period) {
        case 'current-week':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          
          startDate = startOfWeek;
          endDate = endOfWeek;
          compareStartDate = new Date(startOfWeek);
          compareStartDate.setDate(compareStartDate.getDate() - 7);
          compareEndDate = new Date(compareStartDate);
          compareEndDate.setDate(compareEndDate.getDate() + 6);
          break;

        case 'current-quarter':
          const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
          const quarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 + 3, 0);
          startDate = quarterStart;
          endDate = quarterEnd;
          compareStartDate = new Date(quarterStart);
          compareStartDate.setMonth(compareStartDate.getMonth() - 3);
          compareEndDate = new Date(compareStartDate);
          compareEndDate.setMonth(compareEndDate.getMonth() + 3);
          compareEndDate.setDate(0);
          break;

        case 'current-year':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31);
          compareStartDate = new Date(today.getFullYear() - 1, 0, 1);
          compareEndDate = new Date(today.getFullYear() - 1, 11, 31);
          break;

        case 'last-30-days':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          compareStartDate = new Date(startDate);
          compareStartDate.setDate(compareStartDate.getDate() - 30);
          compareEndDate = new Date(startDate);
          break;

        case 'last-90-days':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 90);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          compareStartDate = new Date(startDate);
          compareStartDate.setDate(compareStartDate.getDate() - 90);
          compareEndDate = new Date(startDate);
          break;

        case 'last-year':
          startDate = new Date(today.getFullYear() - 1, 0, 1);
          endDate = new Date(today.getFullYear() - 1, 11, 31);
          compareStartDate = new Date(today.getFullYear() - 2, 0, 1);
          compareEndDate = new Date(today.getFullYear() - 2, 11, 31);
          break;

        case 'current-month':
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          compareStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          compareEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
      }

      return { startDate, endDate, compareStartDate, compareEndDate };
    };

    const { startDate, endDate, compareStartDate, compareEndDate } = getDateRange(period);

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: query },
      {
        $facet: {
          total: [{ $count: "count" }],
          thisMonth: [
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $count: "count" }
          ],
          lastMonth: [
            { $match: { orderDate: { $gte: compareStartDate, $lte: compareEndDate } } },
            { $count: "count" }
          ],
          byStatus: [
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$totalAmount" } } }
          ],
          recentOrders: [
            { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'customers', localField: 'customer', foreignField: '_id', as: 'customer' } },
            { $unwind: '$customer' },
            { $project: { orderCode: 1, orderNumber: 1, customer: '$customer.name', status: 1, totalAmount: 1, createdAt: 1 } }
          ]
        }
      }
    ]);

    // Get sales statistics
    const salesStats = await Sale.aggregate([
      { $match: query },
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                count: { $sum: 1 }
              }
            }
          ],
          thisMonth: [
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                count: { $sum: 1 }
              }
            }
          ],
          lastMonth: [
            { $match: { createdAt: { $gte: compareStartDate, $lte: compareEndDate } } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$totalAmount" },
                count: { $sum: 1 }
              }
            }
          ],
          byPaymentStatus: [
            { $group: { _id: "$paymentStatus", count: { $sum: 1 }, amount: { $sum: "$totalAmount" } } }
          ]
        }
      }
    ]);

    // Get customer statistics
    const customerStats = await Customer.aggregate([
      { $match: query },
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ["$active", "Yes"] }, 1, 0] } },
                inactive: { $sum: { $cond: [{ $eq: ["$active", "No"] }, 1, 0] } }
              }
            }
          ],
          thisMonth: [
            { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
            { $count: "count" }
          ],
          lastMonth: [
            { $match: { createdAt: { $gte: compareStartDate, $lte: compareEndDate } } },
            { $count: "count" }
          ],
          byCity: [
            { $group: { _id: "$city", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    // Get sales persons performance
    const salesPersonsStats = await User.aggregate([
      { 
        $match: { 
          role: 'SALESPERSON',
          ...(query.unit ? { unit: query.unit } : {})
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
          monthlyOrders: {
            $size: {
              $filter: {
                input: '$orders',
                cond: {
                  $and: [
                    { $gte: ['$$this.orderDate', startDate] },
                    { $lte: ['$$this.orderDate', endDate] }
                  ]
                }
              }
            }
          },
          totalRevenue: { $sum: '$orders.totalAmount' }
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          totalOrders: 1,
          monthlyOrders: 1,
          totalRevenue: 1
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 }
    ]);

    // Calculate performance metrics
    const thisMonthOrders = orderStats[0].thisMonth[0]?.count || 0;
    const lastMonthOrders = orderStats[0].lastMonth[0]?.count || 0;
    const orderGrowth = lastMonthOrders > 0 ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders * 100) : 0;

    const thisMonthRevenue = salesStats[0].thisMonth[0]?.totalRevenue || 0;
    const lastMonthRevenue = salesStats[0].lastMonth[0]?.totalRevenue || 0;
    const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

    const thisMonthCustomers = customerStats[0].thisMonth[0]?.count || 0;
    const lastMonthCustomers = customerStats[0].lastMonth[0]?.count || 0;
    const customerGrowth = lastMonthCustomers > 0 ? ((thisMonthCustomers - lastMonthCustomers) / lastMonthCustomers * 100) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalOrders: orderStats[0].total[0]?.count || 0,
          monthlyOrders: thisMonthOrders,
          orderGrowth: orderGrowth.toFixed(1),
          totalRevenue: salesStats[0].total[0]?.totalRevenue || 0,
          monthlyRevenue: thisMonthRevenue,
          revenueGrowth: revenueGrowth.toFixed(1),
          totalCustomers: customerStats[0].total[0]?.total || 0,
          activeCustomers: customerStats[0].total[0]?.active || 0,
          monthlyCustomers: thisMonthCustomers,
          customerGrowth: customerGrowth.toFixed(1),
          totalSalesPersons: salesPersonsStats.length
        },
        orders: {
          byStatus: orderStats[0].byStatus || [],
          recent: orderStats[0].recentOrders || []
        },
        sales: {
          byPaymentStatus: salesStats[0].byPaymentStatus || []
        },
        customers: {
          byCity: customerStats[0].byCity || []
        },
        salesPersons: salesPersonsStats,
        period: {
          current: { start: startDate, end: endDate },
          previous: { start: compareStartDate, end: compareEndDate }
        }
      }
    });
  } catch (error) {
    console.error('Unit Head dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard data', 
      error: error.message 
    });
  }
};

// Get sales persons with their orders and products
export const getUnitHeadSalesPersons = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate } = req.query;

    let matchQuery = {};
    
    // Unit Head can see orders based on their permissions
    if (req.user.role !== USER_ROLES.SUPER_USER && !req.user.permissions?.canAccessAllUnits) {
      matchQuery.unit = req.user.unit;
    }

    // Date filter for orders
    if (startDate && endDate) {
      matchQuery.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      matchQuery.orderDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      matchQuery.orderDate = { $lte: new Date(endDate) };
    }

    // Aggregate sales persons with their order statistics
    const salesPersonsStats = await Order.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'salesPerson',
          foreignField: '_id',
          as: 'salesPersonInfo'
        }
      },
      { $unwind: '$salesPersonInfo' },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: '$customerInfo' },
      {
        $group: {
          _id: '$salesPerson',
          salesPersonName: { $first: '$salesPersonInfo.username' },
          salesPersonEmail: { $first: '$salesPersonInfo.email' },
          salesPersonRole: { $first: '$salesPersonInfo.role' },
          totalOrders: { $sum: 1 },
          totalValue: { $sum: '$totalAmount' },
          uniqueCustomers: { $addToSet: '$customer' },
          orders: {
            $push: {
              orderId: '$_id',
              orderNumber: '$orderNumber',
              orderDate: '$orderDate',
              status: '$status',
              totalAmount: '$totalAmount',
              customer: '$customerInfo',
              products: '$products'
            }
          }
        }
      },
      {
        $addFields: {
          uniqueCustomersCount: { $size: '$uniqueCustomers' }
        }
      },
      { $sort: { totalValue: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    // Get total count for pagination
    const totalCountPipeline = await Order.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'salesPerson',
          foreignField: '_id',
          as: 'salesPersonInfo'
        }
      },
      { $unwind: '$salesPersonInfo' },
      { $group: { _id: '$salesPerson' } },
      { $count: 'total' }
    ]);

    const total = totalCountPipeline[0]?.total || 0;

    // Transform the aggregation results to match frontend expectations
    const salesPersons = salesPersonsStats.map(sp => ({
      _id: sp._id,
      username: sp.salesPersonName,
      email: sp.salesPersonEmail,
      role: sp.salesPersonRole,
      active: true, // Assume active since they have orders
      totalOrders: sp.totalOrders,
      totalRevenue: sp.totalValue,
      uniqueCustomers: sp.uniqueCustomersCount
    }));

    // Calculate summary statistics
    const summary = {
      activeSalesPersons: salesPersons.length,
      totalRevenue: salesPersons.reduce((sum, sp) => sum + sp.totalRevenue, 0),
      totalOrders: salesPersons.reduce((sum, sp) => sum + sp.totalOrders, 0)
    };

    res.json({
      success: true,
      data: {
        salesPersons,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary
      }
    });
  } catch (error) {
    console.error('Unit Head sales persons error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales persons',
      error: error.message
    });
  }
};

// Get detailed orders for a specific sales person
export const getUnitHeadSalesPersonOrders = async (req, res) => {
  try {
    const { salesPersonId } = req.params;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = { salesPerson: salesPersonId };

    // Unit Head can see orders based on their permissions
    if (req.user.role !== USER_ROLES.SUPER_USER && !req.user.permissions?.canAccessAllUnits) {
      query.unit = req.user.unit;
    }

    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date range filter
    if (startDate && endDate) {
      query.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.orderDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.orderDate = { $lte: new Date(endDate) };
    }

    const orders = await Order.find(query)
      .populate({
        path: 'customer',
        select: 'name contactPerson email mobile city address active'
      })
      .populate({
        path: 'salesPerson',
        select: 'username email role'
      })
      .populate({
        path: 'products.product',
        select: 'name code category price'
      })
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    // Calculate statistics for this sales person
    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalOrders: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $in: ['$status', ['completed', 'approved']] }, 1, 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $in: ['$status', ['pending', 'in_production']] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        statistics: stats[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          completed: 0,
          pending: 0
        }
      }
    });
  } catch (error) {
    console.error('Unit Head sales person orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales person orders',
      error: error.message
    });
  }
};

export default {
  getUnitHeadOrders,
  getUnitHeadOrderById,
  getUnitHeadSales,
  getUnitHeadSalesPersons,
  getUnitHeadSalesPersonOrders,
  getUnitHeadCustomers,
  getUnitHeadCustomerById,
  getUnitHeadDashboard
};