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
router.get('/fix-orders', fixOrdersSalesPersonAssignment); // Utility to fix existing orders
// router.get('/users', getSalesPersons); // Commented - data now included in /orders
router.put('/orders/:id/status', updateOrderStatus);
router.get('/dashboard/stats', getDashboardStats);

export default router;
