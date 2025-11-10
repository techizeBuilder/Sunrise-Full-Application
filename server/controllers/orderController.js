import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import { Item } from '../models/Inventory.js';
import notificationService from '../services/notificationService.js';

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
      orderDate: new Date(orderDate),
      products: orderProducts,
      totalAmount,
      status: 'Pending',
      notes
    });

    console.log('Creating order with salesPerson:', req.user._id || req.user.id, 'User:', req.user.username);

    await order.save();

    // Populate order with customer details for notification
    await order.populate('customer', 'name email');

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

    // Build filter query
    const filter = {};

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

    // Get orders with population
    const orders = await Order.find(filter)
      .populate('customer', 'name email mobile')
      .populate('products.product', 'name salePrice purchaseCost mrp brand category subCategory image')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

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

    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
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
    const validStatuses = ['Pending', 'Approved', 'Disapproved', 'In_Production', 'Completed', 'Cancelled'];
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
    if (userRole === 'Unit Manager' || userRole === 'Super User') {
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
      if (status !== 'Cancelled' || order.status !== 'Pending') {
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

// Sales Dashboard API endpoints
const getSalesSummary = async (req, res) => {
  try {
    const { unit } = req.query;
    let query = {};

    // Apply unit filter for non-super users  
    if (req.user.role !== 'Super User') {
      query.unit = req.user.unit;
    } else if (unit) {
      query.unit = unit;
    }

    // Get order counts by status
    const [totalOrders, deliveredCount, inProgressCount, preparationCount] = await Promise.all([
      Order.countDocuments(query),
      Order.countDocuments({ ...query, status: { $in: ['Completed', 'Delivered'] } }),
      Order.countDocuments({ ...query, status: { $in: ['Approved', 'Processing', 'In Progress', 'Shipped', 'Out for Delivery'] } }),
      Order.countDocuments({ ...query, status: { $in: ['Pending', 'Created', 'Confirmed'] } })
    ]);

    res.json({
      success: true,
      totalOrders,
      delivered: deliveredCount,
      inProgress: inProgressCount,
      preparation: preparationCount
    });

  } catch (error) {
    console.error('Get sales summary error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getSalesRecentOrders = async (req, res) => {
  try {
    const { unit, limit = 5 } = req.query;
    let query = {};

    // Apply unit filter for non-super users
    if (req.user.role !== 'Super User') {
      query.unit = req.user.unit;
    } else if (unit) {
      query.unit = unit;
    }

    const orders = await Order.find(query)
      .populate('customer', 'customerName name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('orderCode customer status totalAmount products createdAt orderDate');

    // Transform the data to match frontend expectations
    const transformedOrders = orders.map(order => ({
      _id: order._id,
      orderCode: order.orderCode,
      customerName: order.customer?.customerName || order.customer?.name || 'Unknown Customer',
      status: order.status || 'Pending',
      totalAmount: order.totalAmount || 0,
      totalQuantity: Array.isArray(order.products) ? order.products.reduce((sum, p) => sum + p.quantity, 0) : 0,
      totalItems: Array.isArray(order.products) ? order.products.length : 0,
      items: order.products || [],
      orderDate: order.orderDate || order.createdAt
    }));

    res.json({
      success: true,
      orders: transformedOrders
    });

  } catch (error) {
    console.error('Get sales recent orders error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getSalesSummary,
  getSalesRecentOrders
};