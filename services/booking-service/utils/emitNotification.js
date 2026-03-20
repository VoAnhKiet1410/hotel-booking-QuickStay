/**
 * emitNotification — Booking Service version.
 * Gọi Notification Service qua HTTP thay vì emit socket trực tiếp.
 * Nếu Notification Service không available, fallback: chỉ log.
 */

import { createServiceClient } from '../../../shared/utils/serviceClient.js';
import Notification from '../models/Notification.js';

const notificationClient = createServiceClient(
    process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
);

export const emitNotification = async (receiverId, notification) => {
    // 1. Lưu notification vào DB (shared DB nên vẫn dùng trực tiếp)
    try {
        await Notification.create({
            receiverId: receiverId.toString(),
            type: notification.type,
            message: notification.message,
            data: {
                bookingId: notification.bookingId,
                guestName: notification.guestName,
                totalPrice: notification.totalPrice,
                roomType: notification.roomType,
                hotelName: notification.hotelName,
                ...notification,
                type: undefined,
                message: undefined,
                createdAt: undefined,
            },
        });
    } catch (err) {
        console.error('[Notification] DB save error:', err.message);
    }

    // 2. Gọi Notification Service để emit socket real-time
    try {
        await notificationClient.post('/internal/emit', {
            receiverId: receiverId.toString(),
            notificationData: {
                ...notification,
                createdAt: notification.createdAt || new Date().toISOString(),
            },
        });
    } catch (err) {
        console.warn(
            '[Notification] Cannot reach Notification Service:',
            err.message
        );
    }
};
