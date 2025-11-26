import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  getSalespersonCustomers,
  getSalespersonDeliveries,
  getSalespersonInvoices,
  getSalespersonRefundReturns,
  getSalespersonItems,
  getSalesSummary,
  getSalesRecentOrders,
  getSalesOrders
} from '../controllers/salesController.js';
// Import with different names to avoid conflicts
import { 
  getSalesSummary as getProductSalesSummaryHandler,
  updateSalesSummary as updateProductSalesSummaryHandler 
} from '../controllers/salesSummaryController.js';

const salesRouter = express.Router();

// Debug endpoint without auth to test route registration - MUST be before middleware
salesRouter.get('/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Sales routes are working!',
    timestamp: new Date().toISOString(),
    serverTime: new Date().toLocaleString(),
    availableRoutes: [
      'GET /api/sales/debug (no auth)',
      'GET /api/sales/test-summary (needs auth)',  
      'GET /api/sales/product-summary (needs auth)',
      'POST /api/sales/update-product-summary (needs auth)'
    ]
  });
});

// Apply authentication to all other sales routes
salesRouter.use(authenticateToken);

// Test endpoint with auth to verify middleware is working
salesRouter.get('/test-summary', (req, res) => {
  res.json({
    success: true,
    message: 'Sales summary routes are authenticated and working',
    timestamp: new Date().toISOString(),
    user: req.user ? { 
      id: req.user.id, 
      username: req.user.username, 
      role: req.user.role,
      companyId: req.user.companyId 
    } : 'No user found',
    endpoints: [
      'GET /api/sales/product-summary',
      'POST /api/sales/update-product-summary'
    ]
  });
});

// Sales approval dashboard routes (product summary with calculations)
salesRouter.get('/product-summary', (req, res) => {
  console.log('🔍 GET /product-summary called');
  console.log('User:', req.user ? { id: req.user.id, role: req.user.role, companyId: req.user.companyId } : 'No user');
  console.log('Query params:', req.query);
  
  try {
    getProductSalesSummaryHandler(req, res);
  } catch (error) {
    console.error('Error in product-summary route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

salesRouter.post('/update-product-summary', (req, res) => {
  console.log('🔍 POST /update-product-summary called');
  console.log('User:', req.user ? { id: req.user.id, role: req.user.role, companyId: req.user.companyId } : 'No user');
  console.log('Body:', req.body);
  
  try {
    updateProductSalesSummaryHandler(req, res);
  } catch (error) {
    console.error('Error in update-product-summary route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Apply role-based authorization for other sales routes only
salesRouter.use(authorizeRoles('Sales', 'Unit Manager', 'Super Admin'));

// Sales-specific dashboard routes
salesRouter.get('/summary', getSalesSummary);
salesRouter.get('/recent-orders', getSalesRecentOrders);

// Sales-specific order routes (filtered by individual salesperson)
salesRouter.get('/orders', getSalesOrders);

// Sales-specific customer routes (filtered by salesperson assignment)
salesRouter.get('/customers', getSalespersonCustomers);

// Other salesperson-specific routes
salesRouter.get('/my-customers', getSalespersonCustomers);
salesRouter.get('/my-deliveries', getSalespersonDeliveries);
salesRouter.get('/my-invoices', getSalespersonInvoices);
salesRouter.get('/refund-return', getSalespersonRefundReturns);
salesRouter.get('/items', getSalespersonItems);

export default salesRouter;