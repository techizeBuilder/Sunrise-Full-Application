import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getProductionShiftData,
  getProductionGroupShiftDetails,
  updateProductionShiftTiming,
  getProductionDashboard,
  debugProductSummaryData,
  getUngroupedItems,
  getUngroupedItemsForSheet,
  getUngroupedItemGroup,
  getUngroupedItemProduction,
  updateUngroupedItemProduction,
  updateUngroupedItemProductionWithBatch
} from '../controllers/productionController.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Production Dashboard Routes
// GET /api/production/dashboard - Get production dashboard stats and recent data
router.get('/dashboard', getProductionDashboard);

// POST /api/production/ungrouped-items/production - Create/update ungrouped item production with batch tracking
router.post('/ungrouped-items/production', (req, res, next) => {
  console.log('🏭 Ungrouped items production route hit:', req.method, req.path);
  console.log('Request body:', req.body);
  updateUngroupedItemProductionWithBatch(req, res, next);
});

// GET /api/production/ungrouped-items - Get items not assigned to any production group (for dashboard)
router.get('/ungrouped-items', (req, res, next) => {
  console.log('🔍 Ungrouped items route hit:', req.method, req.path);
  getUngroupedItems(req, res, next);
});

// GET /api/production/ungrouped-items-sheet - Get individual batch entries for production sheet
router.get('/ungrouped-items-sheet', (req, res, next) => {
  console.log('📊 Ungrouped items sheet route hit:', req.method, req.path);
  getUngroupedItemsForSheet(req, res, next);
});

// GET /api/production/ungrouped-item-group - Get items not assigned to any production group (duplicate endpoint)
router.get('/ungrouped-item-group', (req, res, next) => {
  console.log('🔍 Ungrouped item group route hit:', req.method, req.path);
  getUngroupedItemGroup(req, res, next);
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