/**
 * Promo Service — Quản lý Promotion, Coupon, Subscriber.
 * Port: 3008
 */

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import promotionRouter from './routes/promotionRoutes.js';
import subscriberRouter from './routes/subscriberRoutes.js';
import internalRouter from './routes/internalRoutes.js';

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/promotions', promotionRouter);
app.use('/api/subscribers', subscriberRouter);
app.use('/internal', internalRouter);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'promo-service',
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error('Promo service error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
        });
        console.log('Promo Service — MongoDB connected');

        app.listen(PORT, () => {
            console.log(`🎁 Promo Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Promo Service startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
