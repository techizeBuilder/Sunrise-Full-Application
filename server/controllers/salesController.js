import Sale from '../models/Sale.js';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Return from '../models/Return.js';
import { Item } from '../models/Inventory.js';
import { Company } from '../models/Company.js';
import { USER_ROLES } from '../../shared/schema.js';
import User from '../models/User.js';

export const getSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, paymentStatus, unit, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.user.role !== USER_ROLES.SUPER_USER) {
      query.unit = req.user.unit;
    } else if (unit) {
      query.unit = unit;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const sales = await Sale.find(query)
      .populate('order', 'orderNumber')
      .populate('customer', 'customerName contactPerson email phone')
      .populate('dispatch', 'dispatchNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await Sale.findById(id)
      .populate('order')
      .populate('customer')
      .populate('dispatch');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (req.user.role !== USER_ROLES.SUPER_USER && sale.unit !== req.user.unit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Get sale by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createSale = async (req, res) => {
  try {
    const {
      order,
      customer,
      items,
      taxAmount,
      paymentMethod,
      dueDate,
      dispatch,
      notes
    } = req.body;

    if (!order || !customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order, customer, and items are required' });
    }

    // Validate order and customer exist
    const [orderDoc, customerDoc] = await Promise.all([
      Order.findById(order),
      Customer.findById(customer)
    ]);

    if (!orderDoc) {
      return res.status(400).json({ message: 'Order not found' });
    }

    if (!customerDoc) {
      return res.status(400).json({ message: 'Customer not found' });
    }

    // Calculate totals
    let subtotal = 0;
    const saleItems = items.map(item => {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
      return {
        ...item,
        totalPrice: itemTotal
      };
    });

    const taxAmt = taxAmount || 0;
    const totalAmount = subtotal + taxAmt;

    const saleData = {
      order,
      customer,
      items: saleItems,
      subtotal,
      taxAmount: taxAmt,
      totalAmount,
      paymentMethod,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      unit: req.user.role === USER_ROLES.SUPER_USER ? req.body.unit : req.user.unit,
      dispatch,
      notes
    };

    const sale = await Sale.create(saleData);
    await sale.populate([
      { path: 'order', select: 'orderNumber' },
      { path: 'customer', select: 'customerName contactPerson email phone' }
    ]);

    res.status(201).json({
      message: 'Sale created successfully',
      sale
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paymentStatus,
      paymentMethod,
      paidAmount,
      paidDate,
      dueDate,
      notes
    } = req.body;

    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (req.user.role !== USER_ROLES.SUPER_USER && sale.unit !== req.user.unit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {};

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === 'Paid') {
        updateData.paidDate = paidDate ? new Date(paidDate) : new Date();
        updateData.paidAmount = paidAmount || sale.totalAmount;
      }
    }

    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (notes) updateData.notes = notes;

    const updatedSale = await Sale.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate([
      { path: 'order', select: 'orderNumber' },
      { path: 'customer', select: 'customerName contactPerson email phone' },
      { path: 'dispatch', select: 'dispatchNumber' }
    ]);

    res.json({
      message: 'Sale updated successfully',
      sale: updatedSale
    });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await Sale.findById(id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (req.user.role !== USER_ROLES.SUPER_USER && sale.unit !== req.user.unit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (sale.paymentStatus === 'Paid') {
      return res.status(400).json({ message: 'Cannot delete paid sale' });
    }

    await Sale.findByIdAndDelete(id);

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSalesStats = async (req, res) => {
  try {
    const { unit, period = 'month' } = req.query;
    let query = {};

    if (req.user.role !== USER_ROLES.SUPER_USER) {
      query.unit = req.user.unit;
    } else if (unit) {
      query.unit = unit;
    }

    // Date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodQuery = { ...query, createdAt: { $gte: startDate } };

    const [totalSales, paidSales, pendingSales, overdueSales] = await Promise.all([
      Sale.aggregate([
        { $match: periodQuery },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { ...periodQuery, paymentStatus: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { ...periodQuery, paymentStatus: 'Pending' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Sale.aggregate([
        { $match: { ...periodQuery, paymentStatus: 'Overdue' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      period,
      totalSales: totalSales[0] || { total: 0, count: 0 },
      paidSales: paidSales[0] || { total: 0, count: 0 },
      pendingSales: pendingSales[0] || { total: 0, count: 0 },
      overdueSales: overdueSales[0] || { total: 0, count: 0 }
    });

  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Salesperson-specific controller functions
export const getSalespersonCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    const salespersonId = req.user._id || req.user.id;
    const salespersonUsername = req.user.username;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    console.log('🔍 getSalespersonCustomers called:', {
      username: salespersonUsername,
      role: userRole,
      companyId: userCompanyId
    });

    // Build filter query based on user role with company isolation
    let query = {};

    // Always filter by company for data isolation
    if (userCompanyId) {
      query.companyId = userCompanyId;
    }

    // If user is Sales role, only show customers assigned to them
    if (userRole === 'Sales') {
      query.$and = [
        { companyId: userCompanyId }, // Company isolation
        { salesContact: salespersonId } // Assigned customers only
      ];
    }
    // Unit Manager and Super Admin can see all customers from their company
    else if (userRole !== 'Super Admin') {
      // For non-Super Admin roles, ensure company filtering
      query.companyId = userCompanyId;
    }

    if (search) {
      const searchQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { contactPerson: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } }
        ]
      };
      
      if (query.$and) {
        query.$and.push(searchQuery);
      } else {
        query.$and = [query, searchQuery];
      }
    }

    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const customers = await Customer.find(query)
      .populate('salesContact', 'username email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get salesperson customers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSalespersonDeliveries = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const salespersonId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    console.log('🚚 getSalespersonDeliveries called:', {
      userId: salespersonId,
      role: userRole,
      companyId: userCompanyId
    });

    // Build filter query based on user role with company isolation
    let query = {
      status: { $in: ['Shipped', 'Out for Delivery', 'Delivered'] }
    };

    // Always filter by company for data isolation
    if (userCompanyId) {
      query.companyId = userCompanyId;
    }

    // If user is Sales role, only show their deliveries
    if (userRole === 'Sales') {
      query.salesPerson = salespersonId;
    }
    // Unit Manager can see all deliveries from their company
    // Super Admin can see all deliveries
    else if (userRole !== 'Super Admin' && userRole !== 'Unit Manager') {
      query.salesPerson = salespersonId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliveries = await Order.find(query)
      .populate('customer', 'name email mobile city')
      .populate('products.product', 'name')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get salesperson deliveries error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSalespersonInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, paymentStatus = '', search = '' } = req.query;
    const salespersonId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    console.log('🧾 getSalespersonInvoices called:', {
      userId: salespersonId,
      role: userRole,
      companyId: userCompanyId
    });

    // Find orders by role-based filtering with company isolation
    let orderQuery = {};

    // Always filter by company for data isolation
    if (userCompanyId) {
      orderQuery.companyId = userCompanyId;
    }

    // If user is Sales role, only show their invoices
    if (userRole === 'Sales') {
      orderQuery.salesPerson = salespersonId;
    }
    // Unit Manager can see all invoices from their company
    // Super Admin can see all invoices
    else if (userRole !== 'Super Admin' && userRole !== 'Unit Manager') {
      orderQuery.salesPerson = salespersonId;
    }
    
    const salespersonOrders = await Order.find(orderQuery).select('_id');
    const orderIds = salespersonOrders.map(order => order._id);

    // Build filter query for sales/invoices related to orders
    let query = { order: { $in: orderIds } };

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Sale.find(query)
      .populate('order', 'orderCode')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(query);

    res.json({
      success: true,
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get salesperson invoices error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSalespersonRefundReturns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const salespersonId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    console.log('🔄 getSalespersonRefundReturns called:', {
      userId: salespersonId,
      role: userRole,
      companyId: userCompanyId
    });

    // Find orders by role-based filtering with company isolation
    let orderQuery = {};

    // Always filter by company for data isolation
    if (userCompanyId) {
      orderQuery.companyId = userCompanyId;
    }

    // If user is Sales role, only show their returns
    if (userRole === 'Sales') {
      orderQuery.salesPerson = salespersonId;
    }
    // Unit Manager can see all returns from their company
    // Super Admin can see all returns
    else if (userRole !== 'Super Admin' && userRole !== 'Unit Manager') {
      orderQuery.salesPerson = salespersonId;
    }
    
    const salespersonOrders = await Order.find(orderQuery).select('_id');
    const orderIds = salespersonOrders.map(order => order._id);

    // Build filter query for returns related to orders  
    let query = { order: { $in: orderIds } };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { returnCode: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let refundReturns = [];
    let total = 0;

    // Check if Return model exists and has documents
    try {
      refundReturns = await Return.find(query)
        .populate('order', 'orderCode')
        .populate('customer', 'name email mobile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      total = await Return.countDocuments(query);
    } catch (returnError) {
      console.log('Return model not found or empty, returning empty results');
      refundReturns = [];
      total = 0;
    }

    res.json({
      success: true,
      refundReturns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get salesperson refund returns error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get items for salesperson (filtered by company location)
export const getSalespersonItems = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    const { 
      page = 1, 
      limit = 20, 
      search, 
      type, 
      category, 
      subCategory, 
      lowStock,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (page - 1) * limit;
    let query = {};

    // Company location filtering - only show items from same company
    if (userRole === 'Sales' || userRole === 'Unit Manager' || userRole === 'Unit Head') {
      if (userCompanyId) {
        query.store = userCompanyId;
      } else {
        // If no company assigned, return empty results
        return res.json({
          success: true,
          items: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          },
          message: 'No company assigned to user'
        });
      }
    }
    // Super Admin can see all items (no filtering)

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Type filter
    if (type) {
      query.type = type;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Subcategory filter
    if (subCategory) {
      query.subCategory = subCategory;
    }

    // Low stock filter
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$qty', '$minStock'] };
    }

    // Sort options
    let sortOptions = { createdAt: -1 }; // Default: newest first
    
    if (sortBy && sortBy !== 'createdAt') {
      if (sortBy === 'name') {
        sortOptions.name = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'code') {
        sortOptions.code = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'category') {
        sortOptions.category = sortOrder === 'desc' ? -1 : 1;
      } else if (sortBy === 'qty') {
        sortOptions.qty = sortOrder === 'desc' ? -1 : 1;
      }
    }

    const items = await Item.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Resolve company names for store locations
    const itemsWithCompanyNames = await Promise.all(
      items.map(async (item) => {
        const itemObj = item.toObject();
        
        // If store field contains an ObjectId, resolve the company name
        if (itemObj.store && itemObj.store.match(/^[0-9a-fA-F]{24}$/)) {
          try {
            const company = await Company.findById(itemObj.store).select('name city state');
            if (company) {
              itemObj.storeLocation = `${company.name} - ${company.city}, ${company.state}`;
              itemObj.companyId = itemObj.store;
            } else {
              itemObj.storeLocation = 'Unknown Location';
            }
          } catch (error) {
            console.error('Error resolving company for item:', item._id, error);
            itemObj.storeLocation = itemObj.store;
          }
        } else {
          // For backward compatibility with string store names
          itemObj.storeLocation = itemObj.store || 'No Location';
        }
        
        return itemObj;
      })
    );

    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      items: itemsWithCompanyNames,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get salesperson items error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

// Sales-specific order functions moved from orderController
export const getSalesSummary = async (req, res) => {
  try {
    const salespersonId = req.user._id || req.user.id;
    const userCompanyId = req.user.companyId;
    
    console.log('📊 getSalesSummary called:', {
      userId: salespersonId,
      role: req.user.role,
      companyId: userCompanyId
    });
    
    // Always filter by salesperson for sales users
    const filter = {
      salesPerson: salespersonId,
      companyId: userCompanyId
    };
    
    const [totalOrders, pendingOrders, completedOrders, approvedOrders, inProgressOrders] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({ ...filter, status: { $in: ['pending', 'Pending'] } }),
      Order.countDocuments({ ...filter, status: { $in: ['completed', 'Completed'] } }),
      Order.countDocuments({ ...filter, status: { $in: ['approved', 'Approved'] } }),
      Order.countDocuments({ ...filter, status: { $in: ['in_production', 'In_Production'] } })
    ]);
    
    const revenueResult = await Order.aggregate([
      { $match: { ...filter, status: { $in: ['completed', 'Completed', 'approved', 'Approved'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenueResult[0]?.total || 0;
    
    console.log('📊 Sales Summary Results:', {
      totalOrders,
      pendingOrders, 
      completedOrders,
      approvedOrders,
      inProgressOrders,
      totalRevenue,
      filter
    });
    
    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        approvedOrders,
        inProgressOrders,
        totalRevenue
      }
    });
    
  } catch (error) {
    console.error('Error in getSalesSummary:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getSalesRecentOrders = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const salespersonId = req.user._id || req.user.id;
    const userCompanyId = req.user.companyId;
    
    console.log('📋 getSalesRecentOrders called:', {
      userId: salespersonId,
      role: req.user.role,
      companyId: userCompanyId,
      limit
    });
    
    const filter = {
      salesPerson: salespersonId,
      companyId: userCompanyId
    };
    
    const recentOrders = await Order.find(filter)
      .populate('customer', 'name contactPerson email mobile')
      .populate('salesPerson', 'fullName username')
      .populate('products.product', 'name code category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();
      
    // Transform orders to ensure frontend compatibility
    const transformedOrders = recentOrders.map(order => ({
      _id: order._id,
      orderCode: order.orderCode,
      customer: order.customer ? {
        _id: order.customer._id,
        name: order.customer.name,
        contactPerson: order.customer.contactPerson,
        email: order.customer.email,
        mobile: order.customer.mobile
      } : null,
      customerName: order.customer?.name || 'Unknown Customer',
      salesPerson: order.salesPerson ? {
        _id: order.salesPerson._id,
        username: order.salesPerson.username,
        fullName: order.salesPerson.fullName
      } : null,
      status: order.status || 'pending',
      totalAmount: order.totalAmount || 0,
      amount: order.totalAmount || 0,  // Frontend expects 'amount' field
      orderDate: order.orderDate,
      date: order.orderDate || order.createdAt,  // Frontend expects 'date' field  
      createdAt: order.createdAt,
      products: order.products || [],
      items: Array.isArray(order.products) ? order.products.length : 0,  // Frontend expects 'items' count
      totalQuantity: Array.isArray(order.products) ? 
        order.products.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0,
      totalItems: Array.isArray(order.products) ? order.products.length : 0,
      notes: order.notes
    }));
      
    console.log('📋 Recent Orders Results:', {
      count: transformedOrders.length,
      orders: transformedOrders.map(order => ({
        id: order._id,
        orderCode: order.orderCode,
        customer: order.customerName,
        status: order.status,
        totalAmount: order.totalAmount
      }))
    });
    
    res.json({ 
      success: true, 
      orders: transformedOrders,  // Changed from 'data' to 'orders' to match frontend expectation
      count: transformedOrders.length
    });
    
  } catch (error) {
    console.error('Error in getSalesRecentOrders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

export const getSalesOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const salespersonId = req.user._id || req.user.id;
    const userCompanyId = req.user.companyId;

    console.log('📦 getSalesOrders called:', {
      userId: salespersonId,
      role: req.user.role,
      companyId: userCompanyId,
      params: { page, limit, search, status, startDate, endDate }
    });

    // Always filter by individual salesperson for sales API
    const filter = {
      salesPerson: salespersonId,
      companyId: userCompanyId
    };

    if (search) {
      filter.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) {
        filter.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.orderDate.$lte = new Date(endDate);
      }
    }

    const validSortFields = ['createdAt', 'orderDate', 'totalAmount', 'orderCode', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    const limitNum = Math.min(parseInt(limit), 100);

    console.log('📦 Sales Orders Filter:', filter);

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name contactPerson email mobile address city state')
        .populate('salesPerson', 'fullName username email role')
        .populate('products.product', 'name code category salePrice brand')
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Transform orders for frontend compatibility
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderCode: order.orderCode,
      customer: order.customer ? {
        _id: order.customer._id,
        name: order.customer.name,
        contactPerson: order.customer.contactPerson,
        email: order.customer.email,
        mobile: order.customer.mobile,
        address: order.customer.address,
        city: order.customer.city,
        state: order.customer.state
      } : null,
      customerName: order.customer?.name || 'Unknown Customer',
      salesPerson: order.salesPerson ? {
        _id: order.salesPerson._id,
        username: order.salesPerson.username,
        fullName: order.salesPerson.fullName,
        email: order.salesPerson.email,
        role: order.salesPerson.role
      } : null,
      status: order.status || 'pending',
      totalAmount: order.totalAmount || 0,
      orderDate: order.orderDate,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      products: order.products || [],
      totalQuantity: Array.isArray(order.products) ? 
        order.products.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0,
      totalItems: Array.isArray(order.products) ? order.products.length : 0,
      notes: order.notes,
      unit: order.unit,
      companyId: order.companyId
    }));

    const totalPages = Math.ceil(totalOrders / limitNum);

    console.log('📦 Sales Orders Results:', {
      totalOrders,
      currentPage: page,
      totalPages,
      ordersReturned: transformedOrders.length,
      sampleOrder: transformedOrders[0] ? {
        orderCode: transformedOrders[0].orderCode,
        customer: transformedOrders[0].customerName,
        totalAmount: transformedOrders[0].totalAmount
      } : null
    });

    res.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalOrders,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error in getSalesOrders:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
