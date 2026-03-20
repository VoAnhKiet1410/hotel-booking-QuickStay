/**
 * API Gateway — Reverse proxy chuyển tiếp requests tới các microservices.
 *
 * Client chỉ gọi Gateway (:3000), Gateway route tới service phù hợp.
 * Xử lý CORS tập trung, health check aggregation.
 *
 * NOTE: Express 5 thay đổi cách app.use(path) hoạt động — nó strip
 * mount path khỏi req.url trước khi pass vào middleware. Vì vậy ta
 * dùng pathFilter của http-proxy-middleware thay vì mount path.
 */

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ────────────────────────────────────────────────
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
]
    .filter(Boolean)
    .map((url) => url.trim().replace(/\/+$/, ''));

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
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

// ─── Service URL Mapping ─────────────────────────────────
const services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    hotel: process.env.HOTEL_SERVICE_URL || 'http://localhost:3002',
    booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:3003',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
    notification:
        process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
    chat: process.env.CHAT_SERVICE_URL || 'http://localhost:3006',
    review: process.env.REVIEW_SERVICE_URL || 'http://localhost:3007',
    promo: process.env.PROMO_SERVICE_URL || 'http://localhost:3008',
    operations: process.env.OPERATIONS_SERVICE_URL || 'http://localhost:3009',
};

// ─── Proxy Factory (Express 5 compatible) ────────────────
// Express 5 thay đổi cách app.use(path) hoạt động — mount path
// bị strip khỏi req.url. Để đảm bảo proxy gửi đúng path tới
// backend services, ta mount middleware trên '/' và dùng pathFilter
// để route theo prefix.
const createProxy = (pathPrefixes, target) =>
    createProxyMiddleware({
        target,
        changeOrigin: true,
        pathFilter: pathPrefixes,
        on: {
            error: (err, req, res) => {
                console.error(
                    `[Gateway] Proxy error → ${target}: ${err.message}`
                );
                if (!res.headersSent) {
                    res.status(502).json({
                        success: false,
                        message: 'Service unavailable',
                    });
                }
            },
        },
    });

// ─── Route Mapping ──────────────────────────────────────
// Dùng pathFilter thay vì app.use(path) để tránh Express 5
// strip mount path. Mỗi middleware mount trên '/' và tự filter
// theo pathPrefixes.

// Auth / Users
app.use(createProxy(['/api/webhooks/clerk', '/api/users', '/api/admin'], services.auth));

// Hotels & Rooms
app.use(createProxy(['/api/hotels', '/api/rooms', '/api/housekeeping'], services.hotel));

// Bookings
app.use(createProxy('/api/bookings', services.booking));

// Payments (including webhook)
app.use(createProxy(['/api/payments'], services.payment));

// Notifications
app.use(createProxy('/api/notifications', services.notification));

// Chat
app.use(createProxy('/api/chat', services.chat));

// Reviews
app.use(createProxy('/api/reviews', services.review));

// Promotions & Subscribers
app.use(createProxy(['/api/promotions', '/api/subscribers'], services.promo));

// Revenue & Operations
app.use(createProxy(['/api/revenue', '/api/night-audit'], services.operations));

// ─── Aggregated Health Check ────────────────────────────
app.get('/api/health', async (req, res) => {
    // Check tất cả services SONG SONG (thay vì tuần tự)
    const entries = Object.entries(services);
    const checks = entries.map(async ([name, url]) => {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${url}/health`, {
                signal: controller.signal,
            });
            clearTimeout(timer);

            // Safe JSON parse — tránh crash nếu response không phải JSON
            const text = await response.text();
            let data = {};
            try {
                data = JSON.parse(text);
            } catch {
                data = { raw: text.slice(0, 100) };
            }

            return [name, { ...data, status: 'up' }];
        } catch {
            return [name, { status: 'down' }];
        }
    });

    const settled = await Promise.all(checks);
    const results = Object.fromEntries(settled);

    const allUp = Object.values(results).every((s) => s.status === 'up');

    res.status(allUp ? 200 : 503).json({
        status: allUp ? 'ok' : 'degraded',
        service: 'api-gateway',
        timestamp: new Date().toISOString(),
        services: results,
    });
});

// ─── Root ───────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'QuickStay Hotel Booking API Gateway' });
});

// ─── 404 ────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint không tồn tại.',
    });
});

// ─── Global Error Handler ───────────────────────────────
app.use((err, req, res, next) => {
    console.error('Gateway error:', err);
    res.status(500).json({
        success: false,
        message: 'Gateway error',
    });
});

// ─── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log('Services:');
    for (const [name, url] of Object.entries(services)) {
        console.log(`  ${name}: ${url}`);
    }
});
