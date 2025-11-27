import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getItems,
  updateOrderStatus,
  getOrders,
  getDashboardStats,
  getSalesPersons,
  fixOrdersSalesPersonAssignment,
  getAllOrders,
  getOrderById
} from '../controllers/unitManagerController.js';
// Import production group functions from unit head controller (shared functionality)
import {
  getUnitHeadProductionGroups,
  getUnitHeadProductionGroupById,
  createUnitHeadProductionGroup,
  updateUnitHeadProductionGroup,
  deleteUnitHeadProductionGroup,
  getUnitHeadAvailableItems
} from '../controllers/unitHeadController.js';
// Import models for debug endpoint
import User from '../models/User.js';
import Order from '../models/Order.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Test endpoint to verify API structure
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Unit Manager API is working with enhanced grouping',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// Debug endpoint to check users and orders
router.get('/debug', async (req, res) => {
  try {
    const user = req.user;
    
    if (user.role !== 'Unit Manager') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - Unit Manager role required'
      });
    }

    // Check users in same company
    const companyUsers = await User.find({ 
      companyId: user.companyId 
    }).select('_id username role fullName companyId').lean();
    
    // Check orders for these users
    const userIds = companyUsers.map(u => u._id);
    const orders = await Order.find({
      salesPerson: { $in: userIds }
    }).populate('salesPerson', 'username fullName role')
      .populate('customer', 'name')
      .select('orderCode customer salesPerson status orderDate')
      .lean();

    res.json({
      success: true,
      debug: {
        currentUser: {
          id: user._id,
          username: user.username,
          role: user.role,
          companyId: user.companyId
        },
        companyUsers: companyUsers.map(u => ({
          id: u._id,
          username: u.username,
          role: u.role,
          fullName: u.fullName,
          companyId: u.companyId
        })),
        ordersCount: orders.length,
        ordersBySalesPerson: orders.reduce((acc, order) => {
          const spName = order.salesPerson?.username || 'unassigned';
          if (!acc[spName]) acc[spName] = [];
          acc[spName].push({
            orderCode: order.orderCode,
            customer: order.customer?.name,
            status: order.status
          });
          return acc;
        }, {})
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Unit Manager specific routes
router.get('/items', getItems); // Comment out but keep for reference
// COMMENTED OUT - Using product summary API instead
// router.get('/orders', getOrders); // Main API with all data
router.get('/all-orders', getAllOrders); // New endpoint for sales order list
router.get('/sales-order-list', getAllOrders); // Alternative endpoint for sales order list
router.get('/orders/:id', getOrderById); // Get single order details
router.get('/customers', async (req, res) => {
  try {
    const { authenticateToken } = await import('../middleware/auth.js');
    const Customer = (await import('../models/Customer.js')).default;
    
    // Get all customers for dropdown
    const customers = await Customer.find({}, 'name email phone').sort({ name: 1 }).lean();
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
  }
}); // Get customers for filter dropdown
router.get('/salespersons', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    
    // Get all sales persons for dropdown - using multiple role variations
    const salesPersons = await User.find({ 
      role: { $in: ['Sales', 'sales', 'SALES', 'Sales Person', 'SalesPerson'] }
    }, 'fullName email username').sort({ fullName: 1 }).lean();
    
    res.json({ success: true, data: salesPersons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch salespersons', error: error.message });
  }
}); // Get salespersons for filter dropdown
router.get('/fix-orders', fixOrdersSalesPersonAssignment); // Utility to fix existing orders
// router.get('/users', getSalesPersons); // Commented - data now included in /orders
router.put('/orders/:id/status', updateOrderStatus);
router.get('/dashboard/stats', getDashboardStats);

// Production Groups routes (shared with Unit Head)
// Unit Manager and Unit Head work with same production groups in same location/company
router.get('/production-groups', getUnitHeadProductionGroups);
router.get('/production-groups/:id', getUnitHeadProductionGroupById);
router.post('/production-groups', createUnitHeadProductionGroup);
router.put('/production-groups/:id', updateUnitHeadProductionGroup);
router.delete('/production-groups/:id', deleteUnitHeadProductionGroup);
router.get('/production-groups/items/available', getUnitHeadAvailableItems);

export default router;
