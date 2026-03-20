import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    getNotifications,
    markAllRead,
    markOneRead,
    clearAllNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

// Tất cả routes đều yêu cầu đăng nhập
router.use(protect);

// GET /api/notifications — lấy danh sách + unreadCount
router.get('/', getNotifications);

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', markAllRead);

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', markOneRead);

// DELETE /api/notifications — xóa tất cả
router.delete('/', clearAllNotifications);

export default router;
