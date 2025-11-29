import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getProductionShiftData,
  getProductionGroupShiftDetails,
  updateProductionShiftTiming,
  getProductionDashboard
} from '../controllers/productionController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Production Dashboard Routes
// GET /api/production/dashboard - Get production dashboard stats and recent data
router.get('/dashboard', getProductionDashboard);

// Production Shift Management Routes
// GET /api/production/production-shift - Get all production groups for shift management
router.get('/production-shift', getProductionShiftData);

// GET /api/production/production-shift/:groupId - Get specific production group shift details
router.get('/production-shift/:groupId', getProductionGroupShiftDetails);

// PUT /api/production/production-shift/:groupId - Update production shift timing data
router.put('/production-shift/:groupId', updateProductionShiftTiming);

// PUT /api/production/production-shift - Update production shift field (auto-save)
router.put('/production-shift', updateProductionShiftTiming);

export default router;