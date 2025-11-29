import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Sale from '../models/Sale.js';
import { Item } from '../models/Inventory.js';
import User from '../models/User.js';
import ProductionGroup from '../models/ProductionGroup.js';
import { USER_ROLES } from '../../shared/schema.js';

// Debug: Ensure models are loaded
console.log('📦 Models loaded:', {
  Item: !!Item,
  ProductionGroup: !!ProductionGroup,
  User: !!User
});

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

    console.log('🚀 getUnitHeadCustomers called by:', req.user?.username);
    console.log('User details:', {
      id: req.user?.id,
      role: req.user?.role,
      companyId: req.user?.companyId,
      unit: req.user?.unit
    });

    // STRICT VALIDATION: Unit Head MUST have a company assignment
    if (req.user.role === 'Unit Head' && !req.user.companyId) {
      console.error('❌ Unit Head has no company assignment:', req.user.username);
      return res.status(400).json({
        success: false,
        message: 'Unit Head is not assigned to any company/location. Please contact system administrator.'
      });
    }

    let query = {};

    // MANDATORY company filtering for Unit Head users - NO BYPASS
    if (req.user.role === 'Unit Head') {
      query.companyId = req.user.companyId;
      console.log('✅ Filtering customers by companyId:', req.user.companyId);
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

    // Calculate summary statistics for the UI - MUST use same company filtering
    let summaryQuery = {};
    if (req.user.role === 'Unit Head') {
      summaryQuery.companyId = req.user.companyId;
      console.log('📊 Summary statistics filtered by companyId:', req.user.companyId);
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

    console.log('📈 Customer summary for company:', {
      companyId: req.user.companyId,
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      cities: cityDistribution.length
    });

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

    console.log('📊 Unit Head Dashboard request by:', req.user?.username);
    console.log('User details:', {
      id: req.user?.id,
      role: req.user?.role,
      companyId: req.user?.companyId
    });

    // STRICT VALIDATION: Unit Head MUST have a company assignment
    if (req.user.role === 'Unit Head' && !req.user.companyId) {
      console.error('❌ Unit Head has no company assignment for dashboard:', req.user.username);
      return res.status(400).json({
        success: false,
        message: 'Unit Head is not assigned to any company/location. Please contact system administrator.'
      });
    }

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

    // MANDATORY COMPANY FILTERING for dashboard stats - Only show data from same unit/location
    if (req.user.role === 'Unit Head') {
      const companySalesPersons = await User.find({ 
        companyId: req.user.companyId,
        role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
      }).select('_id').lean();
      
      const salesPersonIds = companySalesPersons.map(sp => sp._id);
      matchQuery.salesPerson = { $in: salesPersonIds };
      console.log('✅ Dashboard filtering by company salesPersons:', salesPersonIds.length);
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

    // Get basic counts for this unit only - MANDATORY company filtering
    const totalCustomers = req.user.role === 'Unit Head'
      ? await Customer.countDocuments({ active: true, companyId: req.user.companyId })
      : 0;
    
    const activeSalesPersons = req.user.role === 'Unit Head'
      ? await User.countDocuments({ companyId: req.user.companyId, role: 'Sales', isActive: true })
      : 0;

    console.log('📈 Dashboard metrics for company:', {
      companyId: req.user.companyId,
      totalCustomers,
      activeSalesPersons,
      monthlyOrders,
      monthlyRevenue: monthlyRevenue[0]?.total || 0
    });

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
    const { customerId, orderDate, products, notes, salesPersonId } = req.body;
    const unitHead = req.user;

    console.log('🆕 Creating new order by Unit Head:', unitHead.username);
    console.log('Order data:', { customerId, orderDate, salesPersonId, productsCount: products?.length });

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

    // Validate sales person
    if (!salesPersonId) {
      errors.salesPersonId = 'Sales person is required';
    } else {
      // Check if sales person exists and belongs to same company
      const salesPerson = await User.findOne({
        _id: salesPersonId,
        companyId: unitHead.companyId,
        $or: [
          { role: 'Sales' },
          { role: 'sales' },
          { role: { $regex: /sales/i } }
        ]
      });
      if (!salesPerson) {
        errors.salesPersonId = 'Sales person not found or not from same company';
      }
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
      salesPerson: salesPersonId, // Assigned to selected sales person
      companyId: unitHead.companyId,
      createdBy: unitHead._id // Unit Head as creator, but sales person gets the order
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

// Create Unit Head customer
export const createUnitHeadCustomer = async (req, res) => {
  try {
    // Unit Head can only create customers for their own company
    if (req.user.role !== 'Unit Head' || !req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Prepare customer data with auto-assigned fields
    const customerData = {
      ...req.body,
      companyId: req.user.companyId, // Force company assignment to Unit Head's company
    };

    // Check for duplicate mobile number within the company
    const existingCustomer = await Customer.findOne({ 
      mobile: req.body.mobile,
      companyId: req.user.companyId
    });
    
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this mobile number already exists in your company'
      });
    }

    // Check for duplicate email if provided
    if (req.body.email) {
      const existingEmail = await Customer.findOne({ 
        email: req.body.email,
        companyId: req.user.companyId
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists in your company'
        });
      }
    }

    // If salesContact is provided, validate it belongs to same company and is Sales role
    if (customerData.salesContact) {
      const salesPerson = await User.findById(customerData.salesContact);
      if (!salesPerson || salesPerson.companyId.toString() !== req.user.companyId.toString() || salesPerson.role !== 'Sales') {
        return res.status(400).json({
          success: false,
          message: 'Invalid sales contact selected'
        });
      }
    }

    const customer = new Customer(customerData);
    await customer.save();

    // Populate the response
    await customer.populate([
      { path: 'companyId', select: 'name' },
      { path: 'salesContact', select: 'username email fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });

  } catch (error) {
    console.error('Error creating Unit Head customer:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating customer',
      error: error.message
    });
  }
};

// Update Unit Head customer
export const updateUnitHeadCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Unit Head can only update customers from their own company
    if (req.user.role !== 'Unit Head' || !req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
    }

    // Check if customer exists and belongs to Unit Head's company
    const existingCustomer = await Customer.findOne({ 
      _id: id, 
      companyId: req.user.companyId 
    });
    
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or access denied'
      });
    }

    // Check for duplicate mobile number (excluding current customer)
    if (req.body.mobile) {
      const duplicateMobile = await Customer.findOne({ 
        mobile: req.body.mobile,
        companyId: req.user.companyId,
        _id: { $ne: id }
      });
      if (duplicateMobile) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this mobile number already exists in your company'
        });
      }
    }

    // Check for duplicate email if provided (excluding current customer)
    if (req.body.email) {
      const duplicateEmail = await Customer.findOne({ 
        email: req.body.email,
        companyId: req.user.companyId,
        _id: { $ne: id }
      });
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists in your company'
        });
      }
    }

    // If salesContact is provided, validate it belongs to same company and is Sales role
    if (req.body.salesContact) {
      const salesPerson = await User.findById(req.body.salesContact);
      if (!salesPerson || salesPerson.companyId.toString() !== req.user.companyId.toString() || salesPerson.role !== 'Sales') {
        return res.status(400).json({
          success: false,
          message: 'Invalid sales contact selected'
        });
      }
    }

    // Ensure companyId cannot be changed
    const updateData = { ...req.body };
    delete updateData.companyId;

    const customer = await Customer.findByIdAndUpdate(
      id, 
      updateData, 
      { 
        new: true, 
        runValidators: true 
      }
    ).populate([
      { path: 'companyId', select: 'name' },
      { path: 'salesContact', select: 'username email fullName' }
    ]);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer
    });

  } catch (error) {
    console.error('Error updating Unit Head customer:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
};

// Delete Unit Head customer
export const deleteUnitHeadCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Unit Head can only delete customers from their own company
    if (req.user.role !== 'Unit Head' || !req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
    }

    // Check if customer exists and belongs to Unit Head's company
    const existingCustomer = await Customer.findOne({ 
      _id: id, 
      companyId: req.user.companyId 
    });
    
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found or access denied'
      });
    }

    // TODO: Add business logic check if customer has active orders/invoices
    // For now, we'll allow deletion

    await Customer.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Unit Head customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message
    });
  }
};

// Get sales persons list for customer assignment
export const getUnitHeadSalesPersonsList = async (req, res) => {
  try {
    // Unit Head can only see sales persons from their own company
    if (req.user.role !== 'Unit Head' || !req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const salesPersons = await User.find({
      role: 'Sales',
      companyId: req.user.companyId
    })
    .select('_id username email fullName')
    .sort({ fullName: 1, username: 1 });

    res.json({
      success: true,
      salesPersons
    });

  } catch (error) {
    console.error('Error fetching sales persons list:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales persons',
      error: error.message
    });
  }
};

// Get specific sales person by ID for Unit Head
export const getUnitHeadSalesPersonById = async (req, res) => {
  try {
    const { id } = req.params;

    // Unit Head can only view sales persons from their own company
    if (req.user.role !== 'Unit Head' || !req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sales person ID format'
      });
    }

    const salesPerson = await User.findOne({
      _id: id,
      companyId: req.user.companyId,
      role: 'Sales'
    }).populate('companyId', 'name city state')
      .select('-password -__v');

    if (!salesPerson) {
      return res.status(404).json({
        success: false,
        message: 'Sales person not found or access denied'
      });
    }

    res.json({
      success: true,
      salesPerson
    });

  } catch (error) {
    console.error('Error fetching sales person:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sales person',
      error: error.message
    });
  }
};

// Create new sales person for Unit Head
export const createUnitHeadSalesPerson = async (req, res) => {
  try {
    // Unit Head can only create sales persons for their own company
    if (req.user.role !== 'Unit Head' || !req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Check for duplicate username
    const existingUsername = await User.findOne({ username: req.body.username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Check for duplicate email
    if (req.body.email) {
      const existingEmail = await User.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Prepare user data with company assignment - exclude permissions from req.body to set defaults
    const { permissions, ...bodyWithoutPermissions } = req.body;
    
    const userData = {
      ...bodyWithoutPermissions,
      role: 'Sales', // Force role to Sales
      companyId: req.user.companyId, // Force company assignment to Unit Head's company
      active: req.body.active || 'Yes',
      // Set default Sales permissions - only sales-related, NO inventory access
      permissions: {
        role: 'sales',
        modules: [
          {
            name: 'sales',
            dashboard: true,
            features: [
              { key: 'salesDashboard', view: true, add: true, edit: true, delete: true, alter: true },
              { key: 'orders', view: true, add: true, edit: true, delete: true, alter: true },
              { key: 'myCustomers', view: true, add: true, edit: true, delete: true, alter: true },
              { key: 'myDeliveries', view: true, add: true, edit: true, delete: true, alter: true },
              { key: 'myInvoices', view: true, add: true, edit: true, delete: true, alter: true },
              { key: 'refundReturn', view: true, add: true, edit: true, delete: true, alter: true }
            ]
          }
        ]
      }
    };

    const newUser = new User(userData);
    await newUser.save();

    // Populate the response
    await newUser.populate('companyId', 'name city state');

    // Return consistent success response
    return res.status(201).json({
      success: true,
      message: 'Sales person created successfully',
      salesPerson: {
        ...newUser.toObject(),
        password: undefined // Remove password from response
      }
    });

  } catch (error) {
    console.error('Error creating sales person:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating sales person',
      error: error.message
    });
  }
};

// Update sales person for Unit Head
export const updateUnitHeadSalesPerson = async (req, res) => {
  try {
    const { id } = req.params;

    // Unit Head can only update sales persons from their own company
    if (req.user.role !== 'Unit Head' || !req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sales person ID format'
      });
    }

    // Check if sales person exists and belongs to Unit Head's company
    const existingSalesPerson = await User.findOne({ 
      _id: id, 
      companyId: req.user.companyId,
      role: 'Sales'
    });
    
    if (!existingSalesPerson) {
      return res.status(404).json({
        success: false,
        message: 'Sales person not found or access denied'
      });
    }

    // Check for duplicate username (excluding current user)
    if (req.body.username) {
      const duplicateUsername = await User.findOne({ 
        username: req.body.username,
        _id: { $ne: id }
      });
      if (duplicateUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Check for duplicate email if provided (excluding current user)
    if (req.body.email) {
      const duplicateEmail = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: id }
      });
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Ensure critical fields cannot be changed
    const updateData = { ...req.body };
    delete updateData.companyId; // Cannot change company
    delete updateData.role; // Cannot change role
    delete updateData.password; // Use separate endpoint for password updates

    const updatedSalesPerson = await User.findByIdAndUpdate(
      id, 
      updateData, 
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('companyId', 'name city state')
     .select('-password -__v');

    res.json({
      success: true,
      message: 'Sales person updated successfully',
      salesPerson: updatedSalesPerson
    });

  } catch (error) {
    console.error('Error updating sales person:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating sales person',
      error: error.message
    });
  }
};

// Delete sales person for Unit Head
export const deleteUnitHeadSalesPerson = async (req, res) => {
  try {
    const { id } = req.params;

    // Unit Head can only delete sales persons from their own company
    if (req.user.role !== 'Unit Head' || !req.user.companyId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sales person ID format'
      });
    }

    // Check if sales person exists and belongs to Unit Head's company
    const salesPerson = await User.findOne({ 
      _id: id, 
      companyId: req.user.companyId,
      role: 'Sales'
    });
    
    if (!salesPerson) {
      return res.status(404).json({
        success: false,
        message: 'Sales person not found or access denied'
      });
    }

    // Check if sales person has any active customers assigned
    const assignedCustomers = await Customer.find({ salesContact: id });
    if (assignedCustomers.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete sales person. They have ${assignedCustomers.length} customer(s) assigned. Please reassign customers first.`
      });
    }

    // Check if sales person has any active orders
    const activeOrders = await Order.find({ 
      salesPerson: id,
      status: { $nin: ['Cancelled', 'Completed'] }
    });
    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete sales person. They have ${activeOrders.length} active order(s). Please complete or reassign orders first.`
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Sales person deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting sales person:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting sales person',
      error: error.message
    });
  }
};

// ============= PRODUCTION GROUPS MANAGEMENT =============

// Get all production groups with pagination and filtering
export const getUnitHeadProductionGroups = async (req, res) => {
  try {
    console.log('🔍 Production Groups - User Check:', {
      role: req.user.role,
      username: req.user.username,
      companyId: req.user.companyId
    });
    
    // Check if user is Unit Head or Unit Manager
    if (!['Unit Head', 'Unit Manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied. Unit Head or Unit Manager role required. Current role: ${req.user.role}` });
    }

    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {
      company: req.user.companyId,
      isActive: true
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const totalGroups = await ProductionGroup.countDocuments(filter);

    // Get groups with populated data
    const groups = await ProductionGroup.find(filter)
      .populate('createdBy', 'username email')
      .populate('company', 'name')
      .sort({ [sortBy]: parseInt(sortOrder) === 1 ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalGroups / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalGroups,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error('Error fetching production groups:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get single production group with items
export const getUnitHeadProductionGroupById = async (req, res) => {
  try {
    console.log('🔍 Get Production Group By ID:', {
      id: req.params.id,
      user: {
        userId: req.user?.userId,
        companyId: req.user?.companyId,
        role: req.user?.role
      }
    });

    // Check if user is Unit Head or Unit Manager
    if (!['Unit Head', 'Unit Manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Unit Head or Unit Manager role required.' });
    }

    console.log('🔎 Searching for production group:', { id: req.params.id, companyId: req.user.companyId });

    // First get the production group
    const group = await ProductionGroup.findOne({
      _id: req.params.id,
      company: req.user.companyId,
      isActive: true
    })
      .populate('createdBy', 'username email')
      .populate('company', 'name')
      .lean();

    if (!group) {
      console.log('❌ Production group not found');
      return res.status(404).json({ success: false, message: 'Production group not found' });
    }

    console.log('📋 Raw group data:', {
      id: group._id,
      name: group.name,
      itemIds: group.items,
      itemCount: group.items?.length || 0
    });

    // Manually populate items to ensure proper loading
    let populatedItems = [];
    if (group.items && group.items.length > 0) {
      console.log('🔍 Manually populating items:', group.items);
      
      populatedItems = await Item.find({
        _id: { $in: group.items },
        store: req.user.companyId
      })
        .select('name code category subCategory qty unit price image description')
        .lean();
      
      console.log('📦 Found items for group:', populatedItems.length);
      
      // Format items with image URLs
      populatedItems = populatedItems.map(item => ({
        _id: item._id,
        name: item.name || 'Unnamed Item',
        code: item.code || 'No Code', 
        category: item.category || 'No Category',
        subCategory: item.subCategory || '',
        qty: item.qty || 0,
        unit: item.unit || '',
        price: item.price || 0,
        description: item.description || '',
        image: item.image ? (item.image.startsWith('/uploads/data:') ? item.image.replace('/uploads/', '') : item.image) : null
      }));
    }

    // Create response with populated items
    const response = {
      ...group,
      items: populatedItems
    };

    console.log('📤 Returning group with items:', {
      groupId: response._id,
      itemCount: response.items.length,
      sampleItem: response.items[0] || 'None'
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching production group:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new production group
export const createUnitHeadProductionGroup = async (req, res) => {
  try {
    console.log('🚀 Create Production Group Request:', {
      body: req.body,
      user: {
        userId: req.user?.userId,
        companyId: req.user?.companyId,
        role: req.user?.role,
        username: req.user?.username
      }
    });

    // Check if user is Unit Head or Unit Manager
    if (!['Unit Head', 'Unit Manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Unit Head or Unit Manager role required.' });
    }

    // Validate user object has required fields
    if (!req.user.userId) {
      console.error('❌ User object missing userId:', req.user);
      return res.status(400).json({ success: false, message: 'Invalid user session. Missing userId.' });
    }

    if (!req.user.companyId) {
      console.error('❌ User object missing companyId:', req.user);
      return res.status(400).json({ success: false, message: 'Invalid user session. Missing companyId.' });
    }

    const { name, description, items = [] } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Group name cannot exceed 100 characters' });
    }

    // Check if group name already exists for this company
    const existingGroup = await ProductionGroup.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      company: req.user.companyId,
      isActive: true
    });

    if (existingGroup) {
      return res.status(400).json({ success: false, message: 'Production group with this name already exists' });
    }

    // Validate items if provided
    let validatedItems = [];
    if (items.length > 0) {
      // Check if items exist and belong to the same company
      const inventoryItems = await Item.find({
        _id: { $in: items },
        store: req.user.companyId
      }).select('_id');

      validatedItems = inventoryItems.map(item => item._id);

      // Check if any items are already assigned to other groups
      const existingAssignments = await ProductionGroup.find({
        company: req.user.companyId,
        isActive: true,
        items: { $in: validatedItems }
      }).select('name items');

      if (existingAssignments.length > 0) {
        const conflictItems = existingAssignments.flatMap(group => 
          group.items.filter(item => validatedItems.some(vItem => vItem.toString() === item.toString()))
        );
        return res.status(400).json({ 
          success: false,
          message: 'Some items are already assigned to other production groups',
          conflictItems: conflictItems
        });
      }
    }

    // Create new production group
    console.log('📝 Creating production group with data:', {
      name: name.trim(),
      company: req.user.companyId,
      createdBy: req.user.userId,
      itemsCount: validatedItems.length
    });

    const productionGroup = new ProductionGroup({
      name: name.trim(),
      description: description?.trim() || '',
      company: req.user.companyId,
      createdBy: req.user.userId,
      items: validatedItems
    });

    console.log('💾 Saving production group...');
    await productionGroup.save();
    console.log('✅ Production group saved successfully:', productionGroup._id);

    // Populate and return the created group
    console.log('🔄 Populating production group data...');
    try {
      await productionGroup.populate('createdBy', 'username email');
      await productionGroup.populate('company', 'name');
      await productionGroup.populate({
        path: 'items',
        select: 'name code category subCategory qty unit price image description'
      });
      console.log('✅ Population completed successfully');
    } catch (populateError) {
      console.warn('⚠️ Population error (non-critical):', populateError.message);
      // Continue without population if there's an issue
    }

    res.status(201).json({
      success: true,
      message: 'Production group created successfully',
      data: productionGroup
    });
  } catch (error) {
    console.error('Error creating production group:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update a production group
export const updateUnitHeadProductionGroup = async (req, res) => {
  try {
    console.log('🔄 UPDATE PRODUCTION GROUP:', {
      id: req.params.id,
      body: req.body,
      user: {
        userId: req.user.userId,
        companyId: req.user.companyId,
        role: req.user.role
      }
    });

    // Check if user is Unit Head or Unit Manager
    if (!['Unit Head', 'Unit Manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Unit Head or Unit Manager role required.' });
    }

    const { name, description, items = [] } = req.body;
    console.log('📝 Update data:', { name, description, itemsCount: items.length, items });

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ success: false, message: 'Group name cannot exceed 100 characters' });
    }

    // Find the group to update
    const existingGroup = await ProductionGroup.findOne({
      _id: req.params.id,
      company: req.user.companyId,
      isActive: true
    });

    console.log('🔍 Found existing group:', {
      found: !!existingGroup,
      currentItems: existingGroup?.items?.length || 0
    });

    if (!existingGroup) {
      return res.status(404).json({ success: false, message: 'Production group not found' });
    }

    // Check if name is unique (excluding current group)
    if (name.trim() !== existingGroup.name) {
      const duplicateGroup = await ProductionGroup.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        company: req.user.companyId,
        isActive: true,
        _id: { $ne: req.params.id }
      });

      if (duplicateGroup) {
        return res.status(400).json({ success: false, message: 'Production group with this name already exists' });
      }
    }

    // Validate items if provided
    let validatedItems = [];
    if (items.length > 0) {
      console.log('🔍 Validating items:', items);
      
      // Check if items exist and belong to the same company - USE 'store' FIELD
      const inventoryItems = await Item.find({
        _id: { $in: items },
        store: req.user.companyId  // FIXED: Use 'store' field not 'company'
      }).select('_id name code');

      console.log('📦 Found inventory items:', {
        requested: items.length,
        found: inventoryItems.length,
        items: inventoryItems.map(item => ({ id: item._id, name: item.name }))
      });

      validatedItems = inventoryItems.map(item => item._id);

      if (validatedItems.length !== items.length) {
        console.log('❌ Item validation failed:', {
          requested: items.length,
          validated: validatedItems.length
        });
        return res.status(400).json({
          success: false,
          message: 'Some selected items are invalid or do not belong to your company'
        });
      }

      // Check if any NEW items are already assigned to other groups
      const newItems = validatedItems.filter(item => 
        !existingGroup.items.some(existingItem => existingItem.toString() === item.toString())
      );

      if (newItems.length > 0) {
        const existingAssignments = await ProductionGroup.find({
          company: req.user.companyId,
          isActive: true,
          _id: { $ne: req.params.id },
          items: { $in: newItems }
        }).select('name items');

        if (existingAssignments.length > 0) {
          const conflictItems = existingAssignments.flatMap(group => 
            group.items.filter(item => newItems.some(newItem => newItem.toString() === item.toString()))
          );
          return res.status(400).json({ 
            success: false,
            message: 'Some items are already assigned to other production groups',
            conflictItems: conflictItems
          });
        }
      }
    }

    // Update the group
    console.log('💾 Updating group with:', {
      name: name.trim(),
      description: description?.trim() || '',
      itemCount: validatedItems.length,
      items: validatedItems
    });

    existingGroup.name = name.trim();
    existingGroup.description = description?.trim() || '';
    existingGroup.items = validatedItems;
    existingGroup.metadata = {
      totalItems: validatedItems.length,
      lastUpdated: new Date()
    };

    console.log('💾 Saving group to database...');
    const savedGroup = await existingGroup.save();
    console.log('✅ Group saved successfully:', {
      id: savedGroup._id,
      itemCount: savedGroup.items.length
    });

    // Populate and return the updated group
    console.log('🔄 Populating group data...');
    await existingGroup.populate('createdBy', 'username email');
    await existingGroup.populate('company', 'name');
    await existingGroup.populate({
      path: 'items',
      model: 'Item',
      select: 'name code category subCategory qty unit price image description'
    });

    console.log('📤 Returning updated group:', {
      id: existingGroup._id,
      name: existingGroup.name,
      itemCount: existingGroup.items.length,
      populatedItems: existingGroup.items.map(item => ({ id: item._id, name: item.name }))
    });

    res.json({
      success: true,
      message: 'Production group updated successfully',
      data: existingGroup
    });
  } catch (error) {
    console.error('Error updating production group:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete (soft delete) a production group
export const deleteUnitHeadProductionGroup = async (req, res) => {
  try {
    // Check if user is Unit Head or Unit Manager
    if (!['Unit Head', 'Unit Manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied. Unit Head or Unit Manager role required.' });
    }

    const group = await ProductionGroup.findOne({
      _id: req.params.id,
      company: req.user.companyId,
      isActive: true
    });

    if (!group) {
      return res.status(404).json({ success: false, message: 'Production group not found' });
    }

    // Soft delete
    group.isActive = false;
    await group.save();

    res.json({
      success: true,
      message: 'Production group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting production group:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get available inventory items for assignment
export const getUnitHeadAvailableItems = async (req, res) => {
  try {
    console.log('🔍 Available Items Request:', {
      role: req.user.role,
      username: req.user.username,
      companyId: req.user.companyId,
      query: req.query
    });
    
    // Check if user is Unit Head or Unit Manager
    if (!['Unit Head', 'Unit Manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: `Access denied. Unit Head or Unit Manager role required. Current role: ${req.user.role}` });
    }

    const { search = '', excludeGroupId = '' } = req.query;
    console.log('📝 Search params:', { search, excludeGroupId });

    // Get total items in company
    const totalCompanyItems = await Item.countDocuments({ store: req.user.companyId });
    console.log('🔢 Total items in company:', totalCompanyItems);

    // Get items already assigned to ALL production groups (including current one)
    const assignedGroupsFilter = {
      company: req.user.companyId,
      isActive: true
    };
    
    console.log('🔄 Getting all assigned items (including current group)');

    const assignedGroups = await ProductionGroup.find(assignedGroupsFilter).select('items');
    const assignedItemIds = assignedGroups.flatMap(group => 
      group.items.map(item => item.toString())
    );
    console.log('🚫 Total assigned items count:', assignedItemIds.length);

    // Build filter for available items
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

    // Get ALL available items (no pagination)
    const items = await Item.find(filter)
      .select('name code category subCategory qty unit price image description store')
      .sort({ name: 1 })
      .lean();

    console.log('📦 Retrieved items:', items.length);

    // Format items with proper image URLs
    const formattedItems = items.map(item => {
      const imageUrl = item.image ? (item.image.startsWith('/uploads/data:') ? item.image.replace('/uploads/', '') : item.image) : null;
      console.log('🖼️ Image processing:', { original: item.image, processed: imageUrl });
      
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
        image: imageUrl
      };
    });

    console.log('📤 Returning formatted items:', {
      total: formattedItems.length,
      withImages: formattedItems.filter(item => item.image).length,
      sampleItem: formattedItems[0] || 'None'
    });

    res.json({
      success: true,
      data: {
        items: formattedItems,
        totalItems: formattedItems.length,
        assignedItemsCount: assignedItemIds.length,
        companyItemsCount: totalCompanyItems
      }
    });
  } catch (error) {
    console.error('Error fetching available items:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};