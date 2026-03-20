/**
 * Internal API Routes — gọi bởi các microservices khác.
 *
 * /internal/rooms/:id        — Lấy room info (Booking Service gọi)
 * /internal/hotels/:id       — Lấy hotel info (Booking Service gọi)
 * /internal/stats/count      — Tổng số hotel + room (Admin Dashboard gọi)
 * /internal/rooms/by-hotel/:hotelId — Lấy rooms theo hotel (Operations Service gọi)
 */

import express from 'express';
import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';

const router = express.Router();

// Lấy room theo ID (cho Booking Service check availability)
router.get('/rooms/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('hotel')
            .lean();
        if (!room) {
            return res
                .status(404)
                .json({ success: false, message: 'Room not found' });
        }
        res.json({ success: true, data: room });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Lấy hotel theo ID (cho Booking Service lấy hotel info)
router.get('/hotels/:id', async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id).lean();
        if (!hotel) {
            return res
                .status(404)
                .json({ success: false, message: 'Hotel not found' });
        }
        res.json({ success: true, data: hotel });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Lấy rooms by hotel (cho Operations Service — night audit, revenue)
router.get('/rooms/by-hotel/:hotelId', async (req, res) => {
    try {
        const rooms = await Room.find({ hotel: req.params.hotelId }).lean();
        res.json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Lấy hotels by owner (cho Booking Service xác minh ownership)
router.get('/hotels/by-owner/:ownerId', async (req, res) => {
    try {
        const hotels = await Hotel.find({ owner: req.params.ownerId })
            .select('_id name')
            .lean();
        res.json({ success: true, data: hotels });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Stats cho Admin Dashboard (Auth Service gọi)
router.get('/stats/count', async (req, res) => {
    try {
        const [hotelCount, roomCount] = await Promise.all([
            Hotel.countDocuments(),
            Room.countDocuments(),
        ]);
        res.json({ success: true, data: { hotelCount, roomCount } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Cập nhật room status (cho Booking Service sync availability)
router.patch('/rooms/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const room = await Room.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!room) {
            return res
                .status(404)
                .json({ success: false, message: 'Room not found' });
        }
        res.json({ success: true, data: room });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
