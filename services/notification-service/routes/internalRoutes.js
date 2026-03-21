/**
 * Internal API Routes — Notification Service.
 *
 * /internal/emit — Nhận event từ các service khác để gửi notification.
 * /internal/send-email — Nhận yêu cầu gửi email từ các service khác.
 */

import express from 'express';
import { emitNotification } from '../utils/emitNotification.js';
import { sendEmail } from '../configs/email.js';

const router = express.Router();

// Nhận event emit notification (Booking/Payment/Chat services gọi)
router.post('/emit', async (req, res) => {
    try {
        const { receiverId, notificationData } = req.body;

        if (!receiverId || !notificationData) {
            return res.status(400).json({
                success: false,
                message: 'receiverId and notificationData required',
            });
        }

        emitNotification(receiverId, notificationData);

        res.json({ success: true, message: 'Notification emitted' });
    } catch (error) {
        console.error('Internal emit error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Nhận yêu cầu gửi email (Booking/Payment services gọi)
router.post('/send-email', async (req, res) => {
    try {
        const { to, subject, html, text } = req.body;

        if (!to || !subject) {
            return res.status(400).json({
                success: false,
                message: 'to and subject required',
            });
        }

        // Respond ngay → tránh serviceClient timeout khi SMTP chậm
        res.json({ success: true, message: 'Email queued' });

        // Gửi email fire-and-forget (không block response)
        sendEmail({ to, subject, html, text }).catch((err) => {
            console.error('Background send-email error:', err.message);
        });
    } catch (error) {
        console.error('Internal send-email error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
