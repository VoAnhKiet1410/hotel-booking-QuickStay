/**
 * Auth Service — Quản lý User, Clerk webhook, Admin auth.
 * Port: 3001
 */

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express';
import clerkWebhook from './controllers/clerkWebhooks.js';
import userRouter from './routes/userRoutes.js';
import adminRouter from './routes/adminRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({ origin: true, credentials: true }));

// Clerk middleware
app.use(
    clerkMiddleware({
        clockSkewInMs:
            process.env.NODE_ENV !== 'production' ? 300_000 : 30_000,
    })
);

// Clerk webhook — cần raw body
app.post(
    '/api/webhooks/clerk',
    express.raw({ type: 'application/json' }),
    clerkWebhook
);

// JSON parser
app.use(express.json());

// Routes
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
    });
});

// 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Auth service error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

// Start
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
        });
        console.log('Auth Service — MongoDB connected');

        app.listen(PORT, () => {
            console.log(`🔐 Auth Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Auth Service startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
