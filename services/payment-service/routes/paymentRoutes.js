import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
    createCheckoutSession,
    verifyPayment,
    handleStripeWebhook,
    getPaymentConfig,
    refundPayment,
    getRefundStatus,
} from '../controllers/paymentController.js'

const router = express.Router()

// Public routes
router.get('/config', getPaymentConfig)
router.get('/verify', verifyPayment)

// Webhook route (must be before express.json() middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook)

// Protected routes
router.post('/create-checkout-session', protect, createCheckoutSession)
router.post('/refund', protect, refundPayment)
router.get('/refund/:bookingId', protect, getRefundStatus)

export default router
