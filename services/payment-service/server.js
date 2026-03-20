/**
 * Payment Service — Stripe checkout, webhook, refund.
 * Port: 3004
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import paymentRouter from './routes/paymentRoutes.js';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors({ origin: true, credentials: true }));

// Stripe webhook cần raw body — phải mount TRƯỚC express.json()
// Nhưng vì dùng router, ta xử lý trong controller bằng express.raw()

app.use(express.json());
app.use('/api/payments', paymentRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'payment-service',
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error('Payment service error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
        });
        console.log('Payment Service — MongoDB connected');

        app.listen(PORT, () => {
            console.log(`💳 Payment Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Payment Service startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
