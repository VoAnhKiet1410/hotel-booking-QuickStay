import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    createReview,
    getReviewsByRoom,
    getReviewsByHotel,
    getMyReviews,
    updateReview,
    deleteReview,
    respondToReview,
    markReviewHelpful,
    getReviewByBooking,
} from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/my', protect, getMyReviews);
router.get('/room/:roomId', getReviewsByRoom);
router.get('/hotel/:hotelId', getReviewsByHotel);
router.get('/booking/:bookingId', protect, getReviewByBooking);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/respond', protect, respondToReview);
router.post('/:id/helpful', protect, markReviewHelpful);

export default router;
