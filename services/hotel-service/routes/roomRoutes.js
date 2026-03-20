import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { requireOwnerWithHotel } from '../middleware/ownerMiddleware.js';
import {
    createRoomForOwner,
    deleteRoomForOwner,
    getAllRooms,
    getRoomById,
    getOwnerRooms,
    toggleRoomAvailability,
    updateRoomStatusForOwner,
    updateRoomForOwner,
} from '../controllers/roomController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Owner routes (protected)
router.get('/owner', protect, requireOwnerWithHotel, getOwnerRooms);
router.post(
    '/owner',
    protect,
    requireOwnerWithHotel,
    upload.array('images', 5),
    createRoomForOwner
);
router.patch(
    '/owner/:id/status',
    protect,
    requireOwnerWithHotel,
    updateRoomStatusForOwner
);
router.patch(
    '/owner/:id',
    protect,
    requireOwnerWithHotel,
    upload.array('images', 5),
    updateRoomForOwner
);
router.delete(
    '/owner/:id',
    protect,
    requireOwnerWithHotel,
    deleteRoomForOwner
);
router.patch(
    '/:id/toggle-availability',
    protect,
    requireOwnerWithHotel,
    toggleRoomAvailability
);

// Public routes
router.get('/', getAllRooms);
router.get('/:id', getRoomById);

export default router;
