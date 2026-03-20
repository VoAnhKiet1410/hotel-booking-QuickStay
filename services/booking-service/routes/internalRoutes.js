/**
 * Internal API Routes — Booking Service.
 *
 * Endpoints gọi bởi các services khác (Hotel, Operations, Review):
 * - /internal/rooms/:roomId/has-bookings — Kiểm tra room có booking không (Hotel Service gọi trước khi xóa room)
 * - /internal/stats/count — Tổng số booking (Admin Dashboard gọi)
 * - /internal/bookings/active — Lấy bookings active (Operations Service — night audit)
 * - /internal/bookings/:id — Lấy booking theo ID (Review Service verify)
 */

import express from 'express';
import Booking from '../models/Booking.js';

const router = express.Router();

// Kiểm tra room có booking không (Hotel Service gọi trước khi xóa room)
router.get('/rooms/:roomId/has-bookings', async (req, res) => {
    try {
        const hasBookings = await Booking.exists({ room: req.params.roomId });
        res.json({ success: true, data: { hasBookings: !!hasBookings } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Stats cho Admin Dashboard
router.get('/stats/count', async (req, res) => {
    try {
        const count = await Booking.countDocuments();
        res.json({ success: true, data: { count } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Lấy bookings active (cho Night Audit)
router.get('/bookings/active', async (req, res) => {
    try {
        const { hotelIds, status } = req.query;
        const filter = {};

        if (hotelIds) {
            filter.hotel = { $in: hotelIds.split(',') };
        }
        if (status) {
            filter.status = { $in: status.split(',') };
        }

        const bookings = await Booking.find(filter).lean();
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Lấy booking theo ID (Review Service verify)
router.get('/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).lean();
        if (!booking) {
            return res
                .status(404)
                .json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
