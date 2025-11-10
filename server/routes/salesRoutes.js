import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getSalesSummary,
  getSalesRecentOrders
} from '../controllers/orderController.js';

const salesRouter = express.Router();

salesRouter.use(authenticateToken);
salesRouter.get('/summary', getSalesSummary);
salesRouter.get('/recent-orders', getSalesRecentOrders);

export default salesRouter;