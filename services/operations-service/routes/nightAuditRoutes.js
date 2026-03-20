/**
 * Night Audit Routes
 *
 * Endpoints cho owner quản lý Night Audit.
 */
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireOwnerWithHotel } from '../middleware/ownerMiddleware.js';
import {
    triggerNightAudit,
    getAuditLogs,
    getAuditLogDetail,
    exportAuditLog,
} from '../controllers/nightAuditController.js';

const router = express.Router();

// POST /api/night-audit/owner/trigger — chạy audit thủ công
router.post(
    '/owner/trigger',
    protect,
    requireOwnerWithHotel,
    triggerNightAudit,
);

// GET /api/night-audit/owner/logs — lịch sử audit logs
router.get(
    '/owner/logs',
    protect,
    requireOwnerWithHotel,
    getAuditLogs,
);

// GET /api/night-audit/owner/logs/:id/export — xuất báo cáo CSV
// ⚠️ Route cụ thể hơn PHẢI đặt trước route generic /:id
router.get(
    '/owner/logs/:id/export',
    protect,
    requireOwnerWithHotel,
    exportAuditLog,
);

// GET /api/night-audit/owner/logs/:id — chi tiết 1 log
router.get(
    '/owner/logs/:id',
    protect,
    requireOwnerWithHotel,
    getAuditLogDetail,
);

export default router;
