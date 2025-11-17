import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
  getSalesSummary,
  getSalesRecentOrders,
  getSalespersonOrders
} from '../controllers/orderController.js';
import {
  getSalespersonCustomers,
  getSalespersonDeliveries,
  getSalespersonInvoices,
  getSalespersonRefundReturns,
  getSalespersonItems
} from '../controllers/salesController.js';

const salesRouter = express.Router();

// Apply authentication to all sales routes
salesRouter.use(authenticateToken);
// Apply role-based authorization for sales roles only
salesRouter.use(authorizeRoles('Sales', 'Unit Manager', 'Super Admin'));

// Existing routes
salesRouter.get('/summary', getSalesSummary);
salesRouter.get('/recent-orders', getSalesRecentOrders);

// New salesperson-specific routes
salesRouter.get('/orders', getSalespersonOrders);
salesRouter.get('/my-customers', getSalespersonCustomers);
salesRouter.get('/my-deliveries', getSalespersonDeliveries);
salesRouter.get('/my-invoices', getSalespersonInvoices);
salesRouter.get('/refund-return', getSalespersonRefundReturns);
salesRouter.get('/items', getSalespersonItems);

export default salesRouter;