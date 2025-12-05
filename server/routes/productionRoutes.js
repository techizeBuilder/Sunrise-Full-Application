import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getProductionShiftData,
  getProductionGroupShiftDetails,
  updateProductionShiftTiming,
  getProductionDashboard,
  debugProductSummaryData,
  getUngroupedItems,
  getUngroupedItemProduction,
  updateUngroupedItemProduction
} from '../controllers/productionController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Production Dashboard Routes
// GET /api/production/dashboard - Get production dashboard stats and recent data
router.get('/dashboard', getProductionDashboard);

// Test route to verify production routes are working
router.get('/test', (req, res) => {
  console.log('✅ Production test route working');
  res.json({ 
    success: true, 
    message: 'Production routes are working!',
    timestamp: new Date().toISOString()
  });
});

// GET /api/production/ungrouped-items - Get items not assigned to any production group
router.get('/ungrouped-items', (req, res, next) => {
  console.log('🔍 Ungrouped items route hit:', req.method, req.path);
  getUngroupedItems(req, res, next);
});

// GET /api/production/ungrouped-items/production - Get production data for ungrouped items
router.get('/ungrouped-items/production', (req, res, next) => {
  console.log('🏭 Ungrouped items production data route hit:', req.method, req.path);
  getUngroupedItemProduction(req, res, next);
});

// PUT /api/production/ungrouped-items/production - Update production data for ungrouped items
router.put('/ungrouped-items/production', (req, res, next) => {
  console.log('🔄 Ungrouped items production update route hit:', req.method, req.path);
  updateUngroupedItemProduction(req, res, next);
});

// Production Shift Management Routes
// GET /api/production/production-shift - Get all production groups for shift management
router.get('/production-shift', getProductionShiftData);

// GET /api/production/production-shift/:groupId - Get specific production group shift details
router.get('/production-shift/:groupId', getProductionGroupShiftDetails);

// PUT /api/production/production-shift/:groupId - Update production shift timing data
router.put('/production-shift/:groupId', updateProductionShiftTiming);

// PUT /api/production/production-shift - Update production shift field (auto-save)
router.put('/production-shift', updateProductionShiftTiming);

// Debug endpoint to check ProductDailySummary data
router.get('/debug-summary', debugProductSummaryData);

export default router;