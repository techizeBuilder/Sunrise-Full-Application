import express from 'express';
import { authenticateToken as auth } from '../middleware/auth.js';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  exportCustomersToExcel,
  importCustomersFromExcel,
  validateCustomer,
  validateCustomerQuery
} from '../controllers/customerController.js';
import { resetCustomerCollectionRoute } from '../utils/resetCustomerCollection.js';
import { inspectDatabaseRoute } from '../utils/inspectDatabase.js';
import { seedCustomersRoute } from '../seed/seedCustomers.js';

const router = express.Router();

// Utility routes (must be before /:id route)
router.post('/customers/reset-collection', auth, resetCustomerCollectionRoute);
router.post('/customers/seed', auth, seedCustomersRoute);
router.get('/customers/stats', auth, getCustomerStats);
router.get('/customers/export', auth, exportCustomersToExcel);
router.post('/customers/import', auth, importCustomersFromExcel);

// Customer CRUD routes
router.get('/customers', auth, getCustomers);
router.post('/customers', auth, createCustomer);
router.get('/customers/:id', auth, getCustomerById);
router.put('/customers/:id', auth, updateCustomer);
router.delete('/customers/:id', auth, deleteCustomer);

export default router;