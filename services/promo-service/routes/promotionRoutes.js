import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { requireOwnerWithHotel } from '../middleware/ownerMiddleware.js';
import {
    getActivePromotions,
    getPromotionById,
    claimCoupon,
    validateCoupon,
    getMyCoupons,
    createPromotion,
    getOwnerPromotions,
    updatePromotion,
    deletePromotion,
} from '../controllers/promotionController.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Public routes
router.get('/', getActivePromotions);

// User routes (cần đăng nhập)
router.post('/claim', protect, claimCoupon);
router.post('/validate', protect, validateCoupon);
router.get('/my-coupons', protect, getMyCoupons);

// Owner routes
router.get('/owner', protect, requireOwnerWithHotel, getOwnerPromotions);
router.post('/owner', protect, requireOwnerWithHotel, upload.single('image'), createPromotion);
router.patch('/owner/:id', protect, requireOwnerWithHotel, upload.single('image'), updatePromotion);
router.delete('/owner/:id', protect, requireOwnerWithHotel, deletePromotion);

// Dynamic param (đặt cuối)
router.get('/:id', getPromotionById);

export default router;
