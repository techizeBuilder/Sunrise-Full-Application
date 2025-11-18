import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';
import {
  getUnitHeadOrders,
  getUnitHeadOrderById,
  getUnitHeadSales,
  getUnitHeadSalesPersons,
  getUnitHeadSalesPersonOrders,
  getUnitHeadCustomers,
  getUnitHeadCustomerById,
  getUnitHeadDashboard
} from '../controllers/unitHeadController.js';

// Import Unit User management functions (all unit roles)
import {
  getUnitUsers,
  createUnitUser,
  updateUnitUser,
  updateUnitUserPassword,
  deleteUnitUser,
  getUnitUserById,
  getUnitHeadCompanyInfo,
  // Keep existing functions for backward compatibility
  getUnitManagers,
  createUnitManager,
  updateUnitManager,
  updateUnitManagerPassword,
  deleteUnitManager,
  getUnitManagerById,
  getUnitManagerModules
} from '../controllers/unitHeadUserController.js';

// Import inventory functions
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  adjustStock,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCustomerCategories,
  createCustomerCategory,
  updateCustomerCategory,
  deleteCustomerCategory,
  getLowStockItems,
  getInventoryStats,
  exportItemsToExcel,
  importItemsFromExcel,
  exportCategoriesToExcel,
  exportCustomerCategoriesToExcel
} from '../controllers/inventoryController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Unit Head Dashboard
router.get('/dashboard', 
  checkPermission('unitHead', 'dashboard', 'view'), 
  getUnitHeadDashboard
);

// Unit Head Orders Routes
router.get('/orders', 
  checkPermission('unitHead', 'orders', 'view'), 
  getUnitHeadOrders
);

router.get('/orders/:id', 
  checkPermission('unitHead', 'orders', 'view'), 
  getUnitHeadOrderById
);

// Unit Head Sales Routes
router.get('/sales', 
  checkPermission('unitHead', 'sales', 'view'), 
  getUnitHeadSales
);

// Unit Head Sales Persons with their orders
router.get('/sales-persons', 
  checkPermission('unitHead', 'sales', 'view'), 
  getUnitHeadSalesPersons
);

router.get('/sales-persons/:salesPersonId/orders', 
  checkPermission('unitHead', 'sales', 'view'), 
  getUnitHeadSalesPersonOrders
);

// Unit Head Customers Routes
router.get('/customers', 
  checkPermission('unitHead', 'customers', 'view'), 
  getUnitHeadCustomers
);

router.get('/customers/:id', 
  checkPermission('unitHead', 'customers', 'view'), 
  getUnitHeadCustomerById
);

// Unit Head Inventory Routes (Read-only access for monitoring)
router.get('/inventory/items', 
  checkPermission('unitHead', 'inventory', 'view'), 
  getItems
);

router.get('/inventory/items/:id', 
  checkPermission('unitHead', 'inventory', 'view'), 
  getItemById
);

// Category routes (Read-only)
router.get('/inventory/categories', 
  checkPermission('unitHead', 'inventory', 'view'), 
  getCategories
);

// Customer category routes (Read-only)
router.get('/inventory/customer-categories', 
  checkPermission('unitHead', 'inventory', 'view'), 
  getCustomerCategories
);

// Utility routes (Read-only)
router.get('/inventory/low-stock', 
  checkPermission('unitHead', 'inventory', 'view'), 
  getLowStockItems
);

router.get('/inventory/stats', 
  checkPermission('unitHead', 'inventory', 'view'), 
  getInventoryStats
);

// Excel export routes (Read-only)
router.get('/inventory/items/export', 
  checkPermission('unitHead', 'inventory', 'view'), 
  exportItemsToExcel
);

router.get('/inventory/categories/export', 
  checkPermission('unitHead', 'inventory', 'view'), 
  exportCategoriesToExcel
);

router.get('/inventory/customer-categories/export', 
  checkPermission('unitHead', 'inventory', 'view'), 
  exportCustomerCategoriesToExcel
);

// Get Unit Head company information for form pre-population
router.get('/company-info', getUnitHeadCompanyInfo);

// Unit User Management Routes (All unit roles: Unit Manager, Sales, Production, Accounts, Dispatch, Packing)
router.get('/unit-users', 
  checkPermission('unitHead', 'userManagement', 'view'), 
  getUnitUsers
);

router.get('/unit-users/:userId', 
  checkPermission('unitHead', 'userManagement', 'view'), 
  getUnitUserById
);

router.post('/unit-users', 
  checkPermission('unitHead', 'userManagement', 'add'), 
  createUnitUser
);

router.put('/unit-users/:userId', 
  checkPermission('unitHead', 'userManagement', 'edit'), 
  updateUnitUser
);

router.put('/unit-users/:userId/password', 
  checkPermission('unitHead', 'userManagement', 'edit'), 
  updateUnitUserPassword
);

router.delete('/unit-users/:userId', 
  checkPermission('unitHead', 'userManagement', 'delete'), 
  deleteUnitUser
);

// Unit Manager Management Routes (Legacy - for backward compatibility)
router.get('/unit-managers', 
  checkPermission('unitHead', 'userManagement', 'view'), 
  getUnitManagers
);

router.get('/unit-managers/:userId', 
  checkPermission('unitHead', 'userManagement', 'view'), 
  getUnitManagerById
);

router.post('/unit-managers', 
  checkPermission('unitHead', 'userManagement', 'add'), 
  createUnitManager
);

router.put('/unit-managers/:userId', 
  checkPermission('unitHead', 'userManagement', 'edit'), 
  updateUnitManager
);

router.put('/unit-managers/:userId/password', 
  checkPermission('unitHead', 'userManagement', 'edit'), 
  updateUnitManagerPassword
);

router.delete('/unit-managers/:userId', 
  checkPermission('unitHead', 'userManagement', 'delete'), 
  deleteUnitManager
);

router.get('/modules', 
  checkPermission('unitHead', 'userManagement', 'view'), 
  getUnitManagerModules
);

// Unit Head Role Permission Management endpoint
router.get('/role-permission-management', 
  checkPermission('unitHead', 'userManagement', 'view'), 
  (req, res) => {
    res.json({
      success: true,
      message: 'Unit Head Role Permission Management endpoint',
      data: {
        modules: ['Sales', 'Production', 'Inventory', 'Reports'],
        role: 'Unit Manager',
        unit: req.user.unit
      }
    });
  }
);

export default router;