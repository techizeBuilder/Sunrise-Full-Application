import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import { Item } from '../models/Inventory.js';
import notificationService from '../services/notificationService.js';
import { updateProductSummary } from '../services/productionSummaryService.js';

// Create new order
const createOrder = async (req, res) => {
  try {
    const { customerId, orderDate, products, notes } = req.body;

    // Validation
    const errors = {};

    if (!customerId) {
      errors.customerId = 'Customer ID is required';
    } else {
      // Check if customer exists
      const customerExists = await Customer.findById(customerId);
      if (!customerExists) {
        errors.customerId = 'Customer not found';
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
        if (!product.productId) {
          errors[`products[${i}].productId`] = 'Product ID is required';
        } else {
          // Check if product exists in inventory
          const productExists = await Item.findById(product.productId);
          if (!productExists) {
            errors[`products[${i}].productId`] = 'Product not found';
          }
        }
        
        if (!product.quantity || product.quantity <= 0) {
          errors[`products[${i}].quantity`] = 'Quantity must be greater than 0';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Validation failed.',
        errors
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderProducts = [];

    for (const productItem of products) {
      const product = await Item.findById(productItem.productId);
      const itemTotal = product.salePrice * productItem.quantity;
      totalAmount += itemTotal;
      
      orderProducts.push({
        product: productItem.productId,
        quantity: productItem.quantity,
        price: product.salePrice,
        total: itemTotal
      });
    }

    // Generate unique order code
    let orderCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const orderCount = await Order.countDocuments();
      orderCode = `ORD-${String(orderCount + 1 + attempts).padStart(4, '0')}`;
      
      // Check if this code already exists
      const existingOrder = await Order.findOne({ orderCode });
      if (!existingOrder) {
        isUnique = true;
      } else {
        attempts++;
      }
    }
    
    if (!isUnique) {
      // Fallback to timestamp-based code if still not unique
      orderCode = `ORD-${Date.now().toString().slice(-6)}`;
    }

    // Create order
    const order = new Order({
      orderCode,
      customer: customerId,
      salesPerson: req.user._id || req.user.id, // Use _id or id from authenticated user
      companyId: req.user.companyId, // Auto-assign company from logged-in user
      unit: req.user.unit, // Auto-assign unit from logged-in user
      orderDate: new Date(orderDate),
      products: orderProducts,
      totalAmount,
      status: 'pending',
      notes
    });

    console.log('Creating order with salesPerson:', req.user._id || req.user.id, 'User:', req.user.username);

    await order.save();

    // Populate order with customer details for notification
    await order.populate('customer', 'name email');

    // Update production summary for each product in the order
    try {
      for (const productItem of orderProducts) {
        await updateProductSummary(
          productItem.product.toString(), 
          order.orderDate, 
          order.companyId.toString()
        );
      }
    } catch (summaryError) {
      console.error('Failed to update production summary:', summaryError);
      // Don't fail the order creation if summary update fails
    }

    // Trigger notification for new order
    try {
      await notificationService.triggerOrderNotification({
        _id: order._id,
        orderCode: order.orderCode,
        customerName: order.customer.name
      });
    } catch (notificationError) {
      console.error('Failed to send order notification:', notificationError);
      // Don't fail the order creation if notification fails
    }

    res.status(201).json({
      status: true,
      message: 'Order created successfully.',
      orderId: order._id
    });

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      status: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all orders with filtering and pagination
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      startDate = '',
      endDate = '',
      customerId = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const salespersonId = req.user._id || req.user.id;
    const userRole = req.user.role;
    const userCompanyId = req.user.companyId;

    console.log('=== ORDER FILTERING ===');
    console.log('User details:', {
      id: salespersonId,
      role: userRole,
      companyId: userCompanyId,
      username: req.user.username
    });

    // Build filter query with role-based filtering
    const filter = {};

    // Company-based filtering for Unit Managers
    if (userRole === 'Unit Manager' && userCompanyId) {
      // Get sales persons from the same company
      const User = (await import('../models/User.js')).default;
      const companySalesPersons = await User.find({ 
        companyId: userCompanyId,
        role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
      }).select('_id username fullName role').lean();
      
      const salesPersonIds = companySalesPersons.map(sp => sp._id);
      filter.salesPerson = { $in: salesPersonIds };
      
      console.log('🏢 UNIT MANAGER COMPANY FILTERING');
      console.log('Company ID:', userCompanyId);
      console.log('Company Sales Persons Found:', companySalesPersons.length);
      companySalesPersons.forEach(sp => {
        console.log(`  - ${sp.username} (${sp.fullName || 'No name'}) - ${sp.role}`);
      });
      console.log('Sales Person IDs for filtering:', salesPersonIds);
    }
    // Role-based filtering: Sales users only see their OWN orders
    else if (userRole === 'Sales') {
      filter.salesPerson = salespersonId;
      filter.companyId = userCompanyId; // Additional company isolation
      console.log('👤 SALES PERSON FILTERING - Own orders only from own company');
      console.log('Filter applied:', { salesPerson: salespersonId, companyId: userCompanyId });
    }
    // Super Admin can see all orders
    else if (userRole === 'Super Admin') {
      console.log('👑 SUPER ADMIN - No filtering applied (all orders)');
    }
    // For other roles, also filter by company if available  
    else {
      if (userCompanyId) {
        const User = (await import('../models/User.js')).default;
        const companySalesPersons = await User.find({ 
          companyId: userCompanyId,
          role: { $in: ['Sales', 'Unit Manager', 'Unit Head'] }
        }).select('_id username fullName role').lean();
        
        const salesPersonIds = companySalesPersons.map(sp => sp._id);
        filter.salesPerson = { $in: salesPersonIds };
        
        console.log(`🏢 ${userRole.toUpperCase()} COMPANY FILTERING`);
        console.log('Company ID:', userCompanyId);
        console.log('Company Sales Persons Found:', companySalesPersons.length);
        companySalesPersons.forEach(sp => {
          console.log(`  - ${sp.username} (${sp.fullName || 'No name'}) - ${sp.role}`);
        });
        console.log('Sales Person IDs for filtering:', salesPersonIds);
      } else {
        filter.salesPerson = salespersonId;
        console.log(`👤 ${userRole.toUpperCase()} - No company, filtering own orders only`);
      }
    }

    if (search) {
      filter.$or = [
        { orderCode: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (customerId) {
      filter.customer = customerId;
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

    // Build sort query
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    console.log('Sort query:', sort, 'sortBy:', sortBy, 'sortOrder:', sortOrder);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('=== FINAL FILTER APPLIED ===');
    console.log('Filter object:', JSON.stringify(filter, null, 2));
    console.log('Pagination:', { page, limit, skip });

    // Get orders with population
    const orders = await Order.find(filter)
      .populate('customer', 'name email mobile')
      .populate('products.product', 'name salePrice purchaseCost mrp brand category subCategory image')
      .populate('salesPerson', 'username fullName email role companyId')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    console.log('=== QUERY RESULTS ===');
    console.log('Orders found:', orders.length);
    console.log('Total orders matching filter:', totalOrders);
    
    if (orders.length > 0) {
      console.log('Sample orders:');
      orders.slice(0, 3).forEach(order => {
        console.log(`  Order ${order.orderCode}: Sales Person: ${order.salesPerson?.username || 'Unknown'} (ID: ${order.salesPerson?._id})`);
      });
    }

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('customer', 'name email mobile address city state')
      .populate('products.product', 'name salePrice purchaseCost mrp brand category subCategory image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update order
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerId, orderDate, products, notes, status } = req.body;

    console.log('Update order request:', { id, body: req.body });

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update basic fields
    if (customerId) order.customer = customerId;
    if (orderDate) order.orderDate = new Date(orderDate);
    if (notes !== undefined) order.notes = notes;
    if (status) order.status = status;

    // Update products if provided
    if (products && products.length > 0) {
      let totalAmount = 0;
      const orderProducts = [];

      for (const productItem of products) {
        const product = await Item.findById(productItem.productId);
        if (product) {
          const itemTotal = product.salePrice * productItem.quantity;
          totalAmount += itemTotal;
          
          orderProducts.push({
            product: productItem.productId,
            quantity: productItem.quantity,
            price: product.salePrice,
            total: itemTotal
          });
        }
      }

      order.products = orderProducts;
      order.totalAmount = totalAmount;
    }

    await order.save();

    // Update production summaries for affected products
    try {
      // Update summary for all products in the updated order
      if (products && products.length > 0) {
        for (const productItem of orderProducts) {
          await updateProductSummary(
            productItem.product.toString(),
            order.orderDate,
            order.companyId.toString()
          );
        }
      } else {
        // If products weren't changed, update for existing products
        for (const productItem of order.products) {
          await updateProductSummary(
            productItem.product.toString(),
            order.orderDate,
            order.companyId.toString()
          );
        }
      }
    } catch (summaryError) {
      console.error('Failed to update production summary:', summaryError);
      // Don't fail the order update if summary update fails
    }

    // Populate the updated order
    const updatedOrder = await Order.findById(id)
      .populate('customer', 'name email mobile address city state')
      .populate('products.product', 'name salePrice purchaseCost mrp brand category subCategory image');

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Store order details before deletion for summary updates
    const orderProducts = order.products;
    const orderDate = order.orderDate;
    const companyId = order.companyId;

    // Delete the order
    await Order.findByIdAndDelete(id);

    // Update production summaries for all products in the deleted order
    try {
      for (const productItem of orderProducts) {
        await updateProductSummary(
          productItem.product.toString(),
          orderDate,
          companyId.toString()
        );
      }
    } catch (summaryError) {
      console.error('Failed to update production summary after order deletion:', summaryError);
      // Don't fail the order deletion if summary update fails
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update order status only
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    // Enhanced validation for Unit Manager workflow
    const validStatuses = ['pending', 'approved', 'rejected', 'in_production', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses are: ' + validStatuses.join(', ')
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Role-based permissions for status updates
    const userRole = req.user.role;
    
    // Unit Manager can update any status
    if (userRole === 'Unit Manager' || userRole === 'Super Admin') {
      // Allow all status updates
    }
    // Sales can only update to Cancelled if pending
    else if (userRole === 'Sales') {
      if (order.salesPerson?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own orders'
        });
      }
      if (status !== 'cancelled' || order.status !== 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Sales can only cancel pending orders'
        });
      }
    }
    // Other roles have limited permissions
    else {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update order status'
      });
    }

    // Set context for status history (if schema supports it)
    if (order.statusHistory) {
      order._updatedBy = req.user._id;
      order._statusRemarks = remarks || '';
    }

    // Update fields based on status
    const oldStatus = order.status;
    order.status = status;
    
    if (status === 'Approved') {
      order.approvedBy = req.user._id;
      order.approvedAt = new Date();
    } else if (status === 'Disapproved') {
      order.rejectionReason = remarks;
    } else if (status === 'In_Production') {
      order.productionStartDate = new Date();
    } else if (status === 'Completed') {
      order.productionEndDate = new Date();
      if (!order.actualDeliveryDate) {
        order.actualDeliveryDate = new Date();
      }
    }

    await order.save();

    // Populate the updated order
    const updatedOrder = await Order.findById(id)
      .populate('customer', 'name email mobile address city state')
      .populate('products.product', 'name price brand image')
      .populate('salesPerson', 'username fullName email')
      .populate('approvedBy', 'username fullName');

    res.json({
      success: true,
      message: `Order status updated from ${oldStatus} to ${status}`,
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder
};