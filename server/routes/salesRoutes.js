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

const salesRouter = express.Router();

// Apply authentication to all sales routes
salesRouter.use(authenticateToken);
// Apply role-based authorization for sales roles only
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