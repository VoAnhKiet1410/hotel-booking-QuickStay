/**
 * Booking Service — Quản lý Booking, availability check, coupon validation.
 * Port: 3003
 */

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import bookingRouter from './routes/bookingRoutes.js';
import internalRouter from './routes/internalRoutes.js';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/bookings', bookingRouter);
app.use('/internal', internalRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'booking-service',
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error('Booking service error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
        });
        console.log('Booking Service — MongoDB connected');

        app.listen(PORT, () => {
            console.log(`📋 Booking Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Booking Service startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
