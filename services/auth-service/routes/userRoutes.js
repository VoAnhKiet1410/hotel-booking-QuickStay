import express from 'express';
import {
    getUserdata,
    storeUserRecentSearchedCities,
    getUserById,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public-facing routes (qua Gateway)
router.get('/', protect, getUserdata);
router.post(
    '/store-recent-searched',
    protect,
    storeUserRecentSearchedCities
);

// Internal API (cho các service khác gọi trực tiếp)
router.get('/:id', getUserById);

export default router;
