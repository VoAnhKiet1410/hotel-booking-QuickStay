/**
 * Operations Service — Night Audit, Revenue Reports, Cron Jobs.
 * Port: 3009
 */

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import revenueRouter from './routes/revenueRoutes.js';
import nightAuditRouter from './routes/nightAuditRoutes.js';
import { startReminderJob } from './jobs/reminderJob.js';
import { startNightAuditJob } from './jobs/nightAuditJob.js';

const app = express();
const PORT = process.env.PORT || 3009;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/revenue', revenueRouter);
app.use('/api/night-audit', nightAuditRouter);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'operations-service',
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error('Operations service error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
        });
        console.log('Operations Service — MongoDB connected');

        app.listen(PORT, () => {
            console.log(`⚙️ Operations Service running on port ${PORT}`);
            // Khởi động cron jobs
            startReminderJob();
            startNightAuditJob();
        });
    } catch (error) {
        console.error('Operations Service startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
