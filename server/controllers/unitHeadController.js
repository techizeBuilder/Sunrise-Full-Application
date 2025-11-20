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

    console.log('🚀 Unit Head Orders Request with company filtering');
    console.log('User details:', {
      username: req.user?.username,
      role: req.user?.role,
      companyId: req.user?.companyId
    });

    let query = {};

    // COMPANY FILTERING: Only show orders from sales persons in the same company/location
    if (req.user.companyId) {
      // Get sales persons from the same company
      const companySalesPersons = await User.find({ 
        companyId: req.user.companyId,
        role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
      }).select('_id').lean();
      
      const salesPersonIds = companySalesPersons.map(sp => sp._id);
      console.log(`Filtering orders by ${salesPersonIds.length} sales persons from same company:`, req.user.companyId);
      
      // Filter orders by sales persons from the same company
      query.salesPerson = { $in: salesPersonIds };
    } else {
      console.log('⚠️ WARNING: Unit Head has no company assignment - showing all orders');
    }

    // Apply other filters
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

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));

    const orders = await Order.find(query)
      .populate({
        path: 'customer',
        select: 'name contactPerson email mobile phone address city state pincode active'
      })
      .populate({
        path: 'salesPerson',
        select: 'username fullName email role companyId',
        populate: {
          path: 'companyId',
          select: 'name city state location'
        }
      })
      .populate({
        path: 'products.product',
        select: 'name code category subCategory price specifications'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`Found ${orders.length} orders for Unit Head`);

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

// Get single order by ID for Unit Head
export const getUnitHeadOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = { _id: id };

    // COMPANY FILTERING
    if (req.user.companyId) {
      const companySalesPersons = await User.find({ 
        companyId: req.user.companyId,
        role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
      }).select('_id').lean();
      
      const salesPersonIds = companySalesPersons.map(sp => sp._id);
      query.salesPerson = { $in: salesPersonIds };
    }

    const order = await Order.findOne(query)
      .populate({
        path: 'customer',
        select: 'name contactPerson email mobile phone address city state pincode active'
      })
      .populate({
        path: 'salesPerson',
        select: 'username fullName email role companyId',
        populate: {
          path: 'companyId',
          select: 'name city state location'
        }
      })
      .populate({
        path: 'products.product',
        select: 'name code category subCategory price specifications'
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

// Get Unit Head sales
export const getUnitHeadSales = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let matchQuery = {};

    // COMPANY FILTERING
    if (req.user.companyId) {
      const companySalesPersons = await User.find({ 
        companyId: req.user.companyId,
        role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
      }).select('_id').lean();
      
      const salesPersonIds = companySalesPersons.map(sp => sp._id);
      matchQuery.salesPerson = { $in: salesPersonIds };
    }

    // Date filter
    if (startDate && endDate) {
      matchQuery.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(matchQuery)
      .populate('customer', 'name email phone')
      .populate('salesPerson', 'username fullName email role')
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(matchQuery);

    res.json({
      success: true,
      data: {
        sales,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Unit Head sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales data',
      error: error.message
    });
  }
};

// Get Unit Head sales persons - Fixed with Company Filtering
export const getUnitHeadSalesPersons = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    console.log('🚀 getUnitHeadSalesPersons with company filtering');
    console.log('Unit Head user details:', {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      companyId: req.user.companyId
    });

    // Company filtering: Get ONLY sales persons from the same company
    let salesPersonQuery = { role: 'Sales' };
    
    if (req.user.companyId) {
      salesPersonQuery.companyId = req.user.companyId;
      console.log('Filtering ONLY Sales persons by companyId:', req.user.companyId);
    } else {
      console.log('⚠️ WARNING: Unit Head has no company assignment - showing all sales persons');
    }

    // Add search filter if provided
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      salesPersonQuery.$or = [
        { username: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex }
      ];
    }

    // Get sales persons from the same company
    const salesPersons = await User.find(salesPersonQuery)
      .populate('companyId', 'name city state')
      .select('username fullName email role active createdAt companyId')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    console.log(`Found ${salesPersons.length} sales persons from same company`);

    // Get total count for pagination
    const total = await User.countDocuments(salesPersonQuery);

    // Get order statistics for each sales person
    const salesPersonIds = salesPersons.map(sp => sp._id);
    
    // Build order query for statistics
    let orderQuery = { salesPerson: { $in: salesPersonIds } };
    
    // Date filter for order statistics
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

    // Aggregate order statistics
    const orderStats = await Order.aggregate([
      { $match: orderQuery },
      {
        $group: {
          _id: '$salesPerson',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          uniqueCustomers: { $addToSet: '$customer' },
          recentOrders: { 
            $push: {
              orderId: '$_id',
              orderCode: '$orderCode',
              orderDate: '$orderDate',
              status: '$status',
              totalAmount: '$totalAmount'
            }
          }
        }
      },
      {
        $addFields: {
          uniqueCustomersCount: { $size: '$uniqueCustomers' }
        }
      }
    ]);

    // Create statistics map
    const statsMap = {};
    orderStats.forEach(stat => {
      statsMap[stat._id.toString()] = {
        totalOrders: stat.totalOrders,
        totalRevenue: stat.totalRevenue,
        uniqueCustomers: stat.uniqueCustomersCount,
        recentOrders: stat.recentOrders.slice(-5)
      };
    });

    // Combine sales person data with statistics
    const salesPersonsWithStats = salesPersons.map(sp => {
      const stats = statsMap[sp._id.toString()] || {
        totalOrders: 0,
        totalRevenue: 0,
        uniqueCustomers: 0,
        recentOrders: []
      };

      return {
        _id: sp._id,
        username: sp.username,
        fullName: sp.fullName || sp.username,
        email: sp.email,
        role: sp.role,
        active: sp.active !== false,
        createdAt: sp.createdAt,
        company: sp.companyId ? {
          id: sp.companyId._id,
          name: sp.companyId.name,
          location: sp.companyId.location || `${sp.companyId.city}, ${sp.companyId.state}`
        } : null,
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        uniqueCustomers: stats.uniqueCustomers,
        recentOrders: stats.recentOrders
      };
    });

    // Calculate summary
    const summary = {
      activeSalesPersons: salesPersonsWithStats.filter(sp => sp.active).length,
      totalSalesPersons: salesPersonsWithStats.length,
      totalRevenue: salesPersonsWithStats.reduce((sum, sp) => sum + sp.totalRevenue, 0),
      totalOrders: salesPersonsWithStats.reduce((sum, sp) => sum + sp.totalOrders, 0)
    };

    console.log('Summary:', summary);

    res.json({
      success: true,
      data: {
        salesPersons: salesPersonsWithStats,
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

// Get Unit Head sales person orders
export const getUnitHeadSalesPersonOrders = async (req, res) => {
  try {
    const { salesPersonId } = req.params;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = { salesPerson: salesPersonId };

    // COMPANY FILTERING
    if (req.user.companyId) {
      const salesPerson = await User.findOne({ 
        _id: salesPersonId, 
        companyId: req.user.companyId 
      });
      
      if (!salesPerson) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - Sales person not from your company'
        });
      }
    }

    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate && endDate) {
      query.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email phone address')
      .populate('products.product', 'name code price')
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
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

// Get Unit Head customers
export const getUnitHeadCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, active } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Add company filtering for Unit Head users
    if (req.user.role === 'Unit Head' && req.user.companyId) {
      query.companyId = req.user.companyId;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { city: searchRegex }
      ];
    }

    if (active !== undefined) {
      query.active = active === 'true';
    }

    const customers = await Customer.find(query)
      .populate('companyId', 'name')
      .populate('salesContact', 'fullName username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    // Calculate summary statistics for the UI
    let summaryQuery = {};
    if (req.user.role === 'Unit Head' && req.user.companyId) {
      summaryQuery.companyId = req.user.companyId;
    }

    const totalCustomers = await Customer.countDocuments(summaryQuery);
    const activeCustomers = await Customer.countDocuments({ ...summaryQuery, active: true });
    const inactiveCustomers = await Customer.countDocuments({ ...summaryQuery, active: false });
    
    // Get unique cities for this company's customers
    const cityDistribution = await Customer.distinct('city', summaryQuery);

    const summary = {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      cityDistribution: cityDistribution.filter(city => city) // Remove null/empty cities
    };

    res.json({
      success: true,
      data: {
        customers,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Unit Head customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

// Get Unit Head customer by ID
export const getUnitHeadCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id };

    // Add company filtering for Unit Head users
    if (req.user.role === 'Unit Head' && req.user.companyId) {
      query.companyId = req.user.companyId;
    }

    const customer = await Customer.findOne(query)
      .populate('companyId', 'name')
      .populate('salesContact', 'fullName username');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or not accessible'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Unit Head get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
};

// Get Unit Head dashboard stats
export const getUnitHeadDashboard = async (req, res) => {
  try {
    const { period = 'current-month' } = req.query;
    let matchQuery = {};
    let dateFilter = {};

    // Set date range based on period
    const now = new Date();
    if (period === 'current-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter = {
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
    }

    // COMPANY FILTERING for dashboard stats - Only show data from same unit/location
    if (req.user.companyId) {
      const companySalesPersons = await User.find({ 
        companyId: req.user.companyId,
        role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
      }).select('_id').lean();
      
      const salesPersonIds = companySalesPersons.map(sp => sp._id);
      matchQuery.salesPerson = { $in: salesPersonIds };
    }

    // Combine date filter with company filter
    const fullQuery = { ...matchQuery, ...dateFilter };

    // Get recent orders (last 10 orders from this unit)
    const recentOrders = await Order.find(matchQuery)
      .populate('customer', 'name email phone')
      .populate('salesPerson', 'username email')
      .populate('products.product', 'name code')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate monthly metrics
    const monthlyOrders = await Order.countDocuments(fullQuery);
    const monthlyRevenue = await Order.aggregate([
      { $match: fullQuery },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Get basic counts for this unit only
    const totalCustomers = req.user.companyId 
      ? await Customer.countDocuments({ active: true, companyId: req.user.companyId })
      : await Customer.countDocuments({ active: true });
    
    const activeSalesPersons = req.user.companyId 
      ? await User.countDocuments({ companyId: req.user.companyId, role: 'Sales', isActive: true })
      : 0;

    res.json({
      success: true,
      data: {
        // Monthly metrics
        monthlyOrders,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        totalCustomers,
        activeSalesPersons,
        
        // Recent orders from this unit only
        recentOrders: recentOrders.map(order => ({
          _id: order._id,
          orderCode: order.orderCode,
          customer: order.customer,
          salesPerson: order.salesPerson,
          status: order.status,
          totalAmount: order.totalAmount,
          itemsCount: order.products?.length || 0,
          createdAt: order.createdAt,
          orderDate: order.orderDate
        })),
        
        // Unit location info
        unitLocation: req.user.companyLocation,
        period: period
      }
    });
  } catch (error) {
    console.error('Unit Head dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Unit Head Orders CRUD Operations

// Create new order
export const createUnitHeadOrder = async (req, res) => {
  try {
    const { customerId, orderDate, products, notes } = req.body;
    const unitHead = req.user;

    console.log('🆕 Creating new order by Unit Head:', unitHead.username);

    // Validation
    const errors = {};

    if (!customerId) {
      errors.customerId = 'Customer ID is required';
    } else {
      // Check if customer exists and belongs to same company
      const customer = await Customer.findOne({ 
        _id: customerId,
        ...(unitHead.companyId && { companyId: unitHead.companyId })
      });
      if (!customer) {
        errors.customerId = 'Customer not found or not accessible';
      }
    }

    if (!orderDate) {
      errors.orderDate = 'Order date is required';
    } else if (new Date(orderDate).toString() === 'Invalid Date') {
      errors.orderDate = 'Order date must be a valid date';
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      errors.products = 'At least one product is required';
    } else {
      // Validate each product
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (!product.product) {
          errors[`products[${i}].product`] = 'Product ID is required';
        } else {
          const productExists = await Item.findById(product.product);
          if (!productExists) {
            errors[`products[${i}].product`] = 'Product not found';
          }
        }
        if (!product.quantity || product.quantity <= 0) {
          errors[`products[${i}].quantity`] = 'Product quantity must be greater than 0';
        }
        if (!product.unitPrice || product.unitPrice <= 0) {
          errors[`products[${i}].unitPrice`] = 'Product unit price must be greater than 0';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Generate order code
    const orderCount = await Order.countDocuments();
    const orderCode = `ORD-${(orderCount + 1).toString().padStart(6, '0')}`;

    // Calculate total amount
    let totalAmount = 0;
    const orderProducts = [];
    
    for (const productData of products) {
      const productItem = await Item.findById(productData.product);
      const productTotal = productData.quantity * productData.unitPrice;
      totalAmount += productTotal;
      
      orderProducts.push({
        product: productData.product,
        quantity: productData.quantity,
        price: productData.unitPrice,
        total: productTotal
      });
    }

    // Create order
    const orderData = {
      orderCode,
      customer: customerId,
      orderDate: new Date(orderDate),
      products: orderProducts,
      totalAmount,
      notes,
      status: 'pending',
      salesPerson: unitHead._id, // Unit Head as creator
      companyId: unitHead.companyId,
      createdBy: unitHead._id
    };

    const order = await Order.create(orderData);

    // Populate the order for response
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name email mobile address city state')
      .populate('products.product', 'name salePrice category subCategory image')
      .populate('salesPerson', 'username fullName');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: order._id,
      order: populatedOrder
    });

  } catch (error) {
    console.error('Error creating Unit Head order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update order
export const updateUnitHeadOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, orderDate, products, notes } = req.body;
    const unitHead = req.user;

    console.log('📝 Updating order by Unit Head:', unitHead.username);

    // Find order and check if it belongs to the same company
    const order = await Order.findOne({
      _id: id,
      ...(unitHead.companyId && { companyId: unitHead.companyId })
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not accessible'
      });
    }

    // Validation
    const errors = {};

    if (customerId) {
      const customer = await Customer.findOne({ 
        _id: customerId,
        ...(unitHead.companyId && { companyId: unitHead.companyId })
      });
      if (!customer) {
        errors.customerId = 'Customer not found or not accessible';
      }
    }

    if (orderDate && new Date(orderDate).toString() === 'Invalid Date') {
      errors.orderDate = 'Order date must be a valid date';
    }

    if (products && Array.isArray(products)) {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (product.product) {
          const productExists = await Item.findById(product.product);
          if (!productExists) {
            errors[`products[${i}].product`] = 'Product not found';
          }
        }
        if (product.quantity && product.quantity <= 0) {
          errors[`products[${i}].quantity`] = 'Product quantity must be greater than 0';
        }
        if (product.unitPrice && product.unitPrice <= 0) {
          errors[`products[${i}].unitPrice`] = 'Product unit price must be greater than 0';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Update order fields
    if (customerId) order.customer = customerId;
    if (orderDate) order.orderDate = new Date(orderDate);
    if (notes !== undefined) order.notes = notes;

    // Update products and recalculate total
    if (products && Array.isArray(products)) {
      let totalAmount = 0;
      const orderProducts = [];
      
      for (const productData of products) {
        const productTotal = productData.quantity * productData.unitPrice;
        totalAmount += productTotal;
        
        orderProducts.push({
          product: productData.product,
          quantity: productData.quantity,
          price: productData.unitPrice,
          total: productTotal
        });
      }

      order.products = orderProducts;
      order.totalAmount = totalAmount;
    }

    await order.save();

    // Populate the updated order
    const updatedOrder = await Order.findById(id)
      .populate('customer', 'name email mobile address city state')
      .populate('products.product', 'name salePrice category subCategory image')
      .populate('salesPerson', 'username fullName');

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating Unit Head order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update order status
export const updateUnitHeadOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const unitHead = req.user;

    console.log('🔄 Updating order status by Unit Head:', unitHead.username);

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    // Find order and check if it belongs to the same company
    const order = await Order.findOne({
      _id: id,
      ...(unitHead.companyId && { companyId: unitHead.companyId })
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not accessible'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    if (notes) order.notes = notes;
    
    // Set context for status updates
    if (status === 'confirmed' && !order.confirmedBy) {
      order.confirmedBy = unitHead._id;
      order.confirmedAt = new Date();
    }
    if (status === 'completed' && !order.completedBy) {
      order.completedBy = unitHead._id;
      order.completedAt = new Date();
    }

    await order.save();

    // Populate the updated order
    const updatedOrder = await Order.findById(id)
      .populate('customer', 'name email mobile address')
      .populate('salesPerson', 'username fullName')
      .populate('confirmedBy', 'username fullName')
      .populate('completedBy', 'username fullName');

    res.json({
      success: true,
      message: `Order status updated from ${oldStatus} to ${status}`,
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating Unit Head order status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete order
export const deleteUnitHeadOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const unitHead = req.user;

    console.log('🗑️ Deleting order by Unit Head:', unitHead.username);

    // Find order and check if it belongs to the same company
    const order = await Order.findOne({
      _id: id,
      ...(unitHead.companyId && { companyId: unitHead.companyId })
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not accessible'
      });
    }

    // Check if order can be deleted (only pending or cancelled orders)
    if (order.status === 'completed' || order.status === 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed or processing orders'
      });
    }

    await Order.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Unit Head order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};