/**
 * Internal API Routes — Promo Service.
 *
 * /internal/validate-coupon — Validate coupon code (Booking Service gọi)
 */

import express from 'express';
import Promotion from '../models/Promotion.js';

const router = express.Router();

// Validate coupon code (Booking Service gọi khi tạo booking)
router.post('/validate-coupon', async (req, res) => {
    try {
        const { couponCode, roomType, nights } = req.body;

        if (!couponCode) {
            return res
                .status(400)
                .json({ success: false, message: 'couponCode is required' });
        }

        const promotion = await Promotion.findOne({
            couponCode: couponCode.toUpperCase().trim(),
            isActive: true,
        });

        if (!promotion || !promotion.isValid) {
            return res.json({
                success: true,
                data: { valid: false, reason: 'invalid_or_expired' },
            });
        }

        // Check min nights
        if (nights && nights < promotion.minNights) {
            return res.json({
                success: true,
                data: {
                    valid: false,
                    reason: 'min_nights_not_met',
                    minNights: promotion.minNights,
                },
            });
        }

        // Check applicable room types
        if (roomType && promotion.applicableRoomTypes?.length) {
            if (!promotion.applicableRoomTypes.includes(roomType)) {
                return res.json({
                    success: true,
                    data: {
                        valid: false,
                        reason: 'room_type_not_applicable',
                    },
                });
            }
        }

        res.json({
            success: true,
            data: {
                valid: true,
                promotionId: promotion._id,
                discountType: promotion.discountType,
                discountValue: promotion.discountValue,
                couponCode: promotion.couponCode,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Increment usage count (Booking Service gọi sau khi tạo booking thành công)
router.post('/increment-usage/:promotionId', async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndUpdate(
            req.params.promotionId,
            { $inc: { usedCount: 1 } },
            { new: true }
        );
        res.json({ success: true, data: promotion });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
