import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getSuperAdminDashboard,
  getAllUsers,
  updateUserRole,
  getRoles,
  getSystemModules,
  getSuperAdminOrders,
  getSuperAdminOrderById,
  getSuperAdminSales,
  getSalesPersonById,
  getSuperAdminCustomers,
  getSuperAdminCustomerById
} from '../controllers/superAdminController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Test endpoint to verify Super Admin API structure
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Super Admin API is working',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// Super Admin Dashboard
router.get('/dashboard', getSuperAdminDashboard);

// Role and Permission Management Routes
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.get('/roles', getRoles);
router.get('/modules', getSystemModules);

// Role Permission Management (main endpoint for the page)
router.get('/role-permission-management', (req, res) => {
  res.json({
    success: true,
    message: 'Role Permission Management endpoint',
    data: {
      modules: [
        'Dashboard',
        'Orders', 
        'Purchases',
        'Manufacturing',
        'Production',
        'Dispatches',
        'Sales',
        'Accounts',
        'Inventory',
        'Customers',
        'Suppliers',
        'Companies'
      ]
    }
  });
});

// Orders Management
router.get('/orders', getSuperAdminOrders);
router.get('/orders/:id', getSuperAdminOrderById);

// Sales Management  
router.get('/sales', getSuperAdminSales);
router.get('/sales-person/:salesPersonId', getSalesPersonById);

// Customers Management
router.get('/customers', getSuperAdminCustomers);
router.get('/customers/:id', getSuperAdminCustomerById);

export default router;