import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireOwnerWithHotel } from '../middleware/ownerMiddleware.js';
import {
    getHousekeepingBoard,
    updateHousekeepingStatus,
    batchUpdateHousekeepingStatus,
} from '../controllers/housekeepingController.js';

const router = express.Router();

// Tất cả routes yêu cầu owner đã đăng nhập + có hotel
router.get(
    '/owner/board',
    protect,
    requireOwnerWithHotel,
    getHousekeepingBoard
);
router.patch(
    '/owner/batch',
    protect,
    requireOwnerWithHotel,
    batchUpdateHousekeepingStatus
);
router.patch(
    '/owner/:roomId',
    protect,
    requireOwnerWithHotel,
    updateHousekeepingStatus
);

export default router;
