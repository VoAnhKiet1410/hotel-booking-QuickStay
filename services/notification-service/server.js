/**
 * Notification Service — Socket.IO real-time + email notifications.
 * Port: 3005
 */

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { initSocket } from './configs/socket.js';
import { initEmailService } from './configs/email.js';
import notificationRouter from './routes/notificationRoutes.js';
import internalRouter from './routes/internalRoutes.js';

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 3005;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/notifications', notificationRouter);
app.use('/internal', internalRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'notification-service',
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error('Notification service error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
        });
        console.log('Notification Service — MongoDB connected');

        initEmailService();

        httpServer.listen(PORT, () => {
            console.log(`🔔 Notification Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Notification Service startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
