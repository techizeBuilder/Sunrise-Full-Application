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

// Unit Manager specific routes
router.get('/items', getItems); // Comment out but keep for reference
router.get('/orders', getOrders); // Main API with all data
router.get('/all-orders', getAllOrders); // New endpoint for sales order list
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

export default router;
