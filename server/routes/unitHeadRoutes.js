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

export default router;