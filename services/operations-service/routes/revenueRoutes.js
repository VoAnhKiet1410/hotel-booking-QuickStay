/**
 * Revenue Management Routes
 * 
 * Endpoints for hotel owner revenue analytics.
 */
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireOwnerWithHotel } from '../middleware/ownerMiddleware.js';
import { getOwnerRevenueAnalytics } from '../controllers/revenueController.js';

const router = express.Router();

// GET /api/revenue/owner/analytics?year=2026&month=3
router.get(
    '/owner/analytics',
    protect,
    requireOwnerWithHotel,
    getOwnerRevenueAnalytics
);

export default router;
