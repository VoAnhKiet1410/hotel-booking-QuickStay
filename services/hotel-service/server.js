/**
 * Hotel & Room Service — Quản lý Hotel, Room, Housekeeping, Cloudinary uploads.
 * Port: 3002
 */

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import connectCloudinary from './configs/cloudinary.js';
import hotelRouter from './routes/hotelRoutes.js';
import roomRouter from './routes/roomRoutes.js';
import housekeepingRouter from './routes/housekeepingRoutes.js';
import internalRouter from './routes/internalRoutes.js';

const app = express();
const PORT = process.env.PORT || 3002;

// CORS
app.use(cors({ origin: true, credentials: true }));

// JSON parser
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/hotels', hotelRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/housekeeping', housekeepingRouter);

// Internal API (gọi bởi các services khác, không qua Gateway)
app.use('/internal', internalRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'hotel-service',
        timestamp: new Date().toISOString(),
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Hotel service error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

// Start
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
        });
        console.log('Hotel Service — MongoDB connected');

        await connectCloudinary();

        app.listen(PORT, () => {
            console.log(`🏨 Hotel Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Hotel Service startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
