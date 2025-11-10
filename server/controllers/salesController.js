import Sale from '../models/Sale.js';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import { USER_ROLES } from '../../shared/schema.js';

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
