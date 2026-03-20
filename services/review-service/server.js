/**
 * Review Service — Quản lý đánh giá khách sạn.
 * Port: 3007
 */

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import reviewRouter from './routes/reviewRoutes.js';

const app = express();
const PORT = process.env.PORT || 3007;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/reviews', reviewRouter);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'review-service',
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error('Review service error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
        });
        console.log('Review Service — MongoDB connected');

        app.listen(PORT, () => {
            console.log(`⭐ Review Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Review Service startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
