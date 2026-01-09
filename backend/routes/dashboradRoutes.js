// routes/dashboardRoutes.js
import express from 'express';
import {
  getDashboardStats,
  getSalesTrend,
  getProfitTrend,
  getProfitGrowth,
  getYearOverYearProfitGrowth,
  getMonthlyProfitGrowth,
  getAlerts,
  getCustomerAnalytics
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/sales-trend', getSalesTrend);
router.get('/profit-trend', getProfitTrend);
router.get('/profit-growth', getProfitGrowth);
router.get('/profit-growth/yoy', getYearOverYearProfitGrowth);
router.get('/profit-growth/monthly', getMonthlyProfitGrowth);
router.get('/alerts', getAlerts);
router.get('/customer-analytics', getCustomerAnalytics);

export default router;