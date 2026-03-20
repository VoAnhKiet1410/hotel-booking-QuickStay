import express from 'express';
import multer from 'multer';
import {
    registerHotel,
    getMyHotels,
    getMyHotel,
    updateMyHotel,
    updateMyHotelById,
    deleteMyHotelById,
    getAllHotels,
    getHotelById,
} from '../controllers/hotelController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireHotelOwner } from '../middleware/ownerMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Owner routes (protected)
router.post(
    '/',
    protect,
    requireHotelOwner,
    upload.array('images', 5),
    registerHotel
);
router.get('/my', protect, requireHotelOwner, getMyHotels);
router.get('/my/first', protect, requireHotelOwner, getMyHotel);
router.patch(
    '/my/first',
    protect,
    requireHotelOwner,
    upload.array('images', 5),
    updateMyHotel
);
router.patch(
    '/my/:id',
    protect,
    requireHotelOwner,
    upload.array('images', 5),
    updateMyHotelById
);
router.delete('/my/:id', protect, requireHotelOwner, deleteMyHotelById);

// Public routes
router.get('/', getAllHotels);
router.get('/:id', getHotelById);

export default router;
