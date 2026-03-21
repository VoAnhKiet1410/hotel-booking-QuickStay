/**
 * QuickStay Monolith Server
 * Gộp tất cả 9 microservices thành 1 server duy nhất để deploy miễn phí.
 *
 * Routes giống hệt với gateway (client không cần đổi VITE_BACKEND_URL):
 * - /api/users, /api/admin, /api/webhooks/clerk  → auth
 * - /api/hotels, /api/rooms, /api/housekeeping   → hotel
 * - /api/bookings                                → booking
 * - /api/payments                                → payment
 * - /api/notifications                           → notification
 * - /api/chat                                    → chat
 * - /api/reviews                                 → review
 * - /api/promotions, /api/subscribers            → promo
 * - /api/revenue, /api/night-audit               → operations
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { clerkMiddleware } from '@clerk/express';

// ── Auth Service ────────────────────────────────────────────────
import clerkWebhook from '../services/auth-service/controllers/clerkWebhooks.js';
import userRouter from '../services/auth-service/routes/userRoutes.js';
import adminRouter from '../services/auth-service/routes/adminRoutes.js';

// ── Hotel Service ───────────────────────────────────────────────
import connectCloudinary from '../services/hotel-service/configs/cloudinary.js';
import hotelRouter from '../services/hotel-service/routes/hotelRoutes.js';
import roomRouter from '../services/hotel-service/routes/roomRoutes.js';
import housekeepingRouter from '../services/hotel-service/routes/housekeepingRoutes.js';
import hotelInternalRouter from '../services/hotel-service/routes/internalRoutes.js';

// ── Booking Service ─────────────────────────────────────────────
import bookingRouter from '../services/booking-service/routes/bookingRoutes.js';
import bookingInternalRouter from '../services/booking-service/routes/internalRoutes.js';

// ── Payment Service ─────────────────────────────────────────────
import paymentRouter from '../services/payment-service/routes/paymentRoutes.js';

// ── Notification Service ────────────────────────────────────────
import { initSocket } from '../services/notification-service/configs/socket.js';
import { initEmailService } from '../services/notification-service/configs/email.js';
import { setIo as setChatIo } from '../services/chat-service/configs/chatSocket.js';
import notificationRouter from '../services/notification-service/routes/notificationRoutes.js';
import notificationInternalRouter from '../services/notification-service/routes/internalRoutes.js';

// ── Chat Service ────────────────────────────────────────────────
import chatRouter from '../services/chat-service/routes/chatRoutes.js';

// ── Review Service ──────────────────────────────────────────────
import reviewRouter from '../services/review-service/routes/reviewRoutes.js';

// ── Promo Service ───────────────────────────────────────────────
import promoRouter from '../services/promo-service/routes/promotionRoutes.js';
import subscriberRouter from '../services/promo-service/routes/subscriberRoutes.js';

// ── Operations Service ──────────────────────────────────────────
import revenueRouter from '../services/operations-service/routes/revenueRoutes.js';
import nightAuditRouter from '../services/operations-service/routes/nightAuditRoutes.js';
import { startReminderJob } from '../services/operations-service/jobs/reminderJob.js';
import { startNightAuditJob } from '../services/operations-service/jobs/nightAuditJob.js';

// ────────────────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// ── Socket.IO (notification-service) ───────────────────────────
const io = initSocket(httpServer);
// Share io với chat-service controllers (monolith dùng chung 1 io instance)
setChatIo(io);

// ── Health Check (trước mọi middleware) ──────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'quickstay-monolith',
        timestamp: new Date().toISOString(),
    });
});

// ── Root (trước middleware) ──────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'QuickStay Hotel Booking API' });
});

// ── CORS ────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
]
    .filter(Boolean)
    .map((url) => url.trim().replace(/\/+$/, ''));

app.use(
    cors({
        origin: (origin, callback) => {
            // Cho phép server-to-server (không có origin)
            if (!origin) return callback(null, true);
            // Cho phép các origins đã cấu hình
            if (allowedOrigins.includes(origin)) return callback(null, true);
            // Cho phép tất cả Vercel preview/production URLs
            if (origin.endsWith('.vercel.app')) return callback(null, true);
            // Cho phép Railway URLs (internal calls)
            if (origin.endsWith('.railway.app')) return callback(null, true);
            return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
        ],
    })
);

// ── Clerk Middleware ─────────────────────────────────────────────
app.use((req, res, next) => {
    try {
        clerkMiddleware({
            clockSkewInMs:
                process.env.NODE_ENV !== 'production' ? 300_000 : 30_000,
        })(req, res, next);
    } catch (err) {
        console.error('Clerk middleware error:', err.message);
        next(); // Tiếp tục xử lý dù Clerk lỗi
    }
});

// ── Clerk Webhook — RAW body trước JSON parser ───────────────────
app.post(
    '/api/webhooks/clerk',
    express.raw({ type: 'application/json' }),
    clerkWebhook
);

// ── Stripe Webhook — RAW body (xử lý trong paymentController) ───
// paymentRouter tự dùng express.raw() cho endpoint /webhook nên không cần ở đây

// ── JSON Parser ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Public Routes ────────────────────────────────────────────────

// Auth
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);

// Hotel & Rooms
app.use('/api/hotels', hotelRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/housekeeping', housekeepingRouter);

// Bookings
app.use('/api/bookings', bookingRouter);

// Payments
app.use('/api/payments', paymentRouter);

// Notifications
app.use('/api/notifications', notificationRouter);

// Chat
app.use('/api/chat', chatRouter);

// Reviews
app.use('/api/reviews', reviewRouter);

// Promo & Subscribers
app.use('/api/promotions', promoRouter);
app.use('/api/subscribers', subscriberRouter);

// Operations
app.use('/api/revenue', revenueRouter);
app.use('/api/night-audit', nightAuditRouter);

// ── Internal Routes (inter-service calls trong monolith) ─────────
// Hotel internal: /internal/rooms/:id, /internal/hotels/:id, /internal/stats/count
app.use('/internal', hotelInternalRouter);

// Booking internal: /internal/booking/bookings/:id, /internal/booking/bookings/active
// (mount ở path khác để tránh conflict /internal/stats/count với hotel)
app.use('/internal/booking', bookingInternalRouter);

// Notification internal
app.use('/internal/notification', notificationInternalRouter);

// ── 404 ──────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

// ── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('=== SERVER ERROR ===');
    console.error('Path:', req.method, req.originalUrl);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);
    console.error('===================');
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
});

// ── Start ────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10_000,
            family: 4,
        });
        console.log('✅ MongoDB connected');

        await connectCloudinary();
        console.log('✅ Cloudinary initialized');

        initEmailService();

        httpServer.listen(PORT, () => {
            console.log(`🚀 QuickStay Monolith running on port ${PORT}`);
            // Cron jobs
            startReminderJob();
            startNightAuditJob();
        });
    } catch (error) {
        console.error('❌ Server startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
