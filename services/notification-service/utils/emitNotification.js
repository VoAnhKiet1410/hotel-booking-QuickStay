import { getIo, getReceiverSocketId } from '../configs/socket.js';
import Notification from '../models/Notification.js';

/**
 * Gửi notification real-time qua socket VÀ lưu vào MongoDB (persistent).
 *
 * @param {string} receiverId - Clerk userId của người nhận
 * @param {object} notification - { type, message, bookingId?, guestName?, totalPrice?, ... }
 */
export const emitNotification = async (receiverId, notification) => {
    // 1. Lưu vào DB (persistent) — fire and forget, không block socket
    const saveToDb = async () => {
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
                    ...notification,        // capture any extra fields
                    // loại bỏ fields đã lưu ở root để tránh duplicate
                    type: undefined,
                    message: undefined,
                    createdAt: undefined,
                },
            });
        } catch (err) {
            // Không làm gián đoạn socket — chỉ log lỗi
            console.error('[Notification] DB save error:', err.message);
        }
    };

    // 2. Gửi socket real-time (nếu user đang online)
    try {
        const socketId = getReceiverSocketId(receiverId.toString());
        console.log(`[Notification] receiverId=${receiverId} | type=${notification.type} | socketId=${socketId || 'OFFLINE'}`);
        if (socketId) {
            getIo().to(socketId).emit('newNotification', {
                ...notification,
                createdAt: notification.createdAt || new Date().toISOString(),
            });
            console.log(`[Notification] ✅ Socket sent to ${receiverId}`);
        } else {
            console.warn(`[Notification] ⚠️ User ${receiverId} is OFFLINE — saved to DB only`);
        }
    } catch (err) {
        console.error('[Notification] Socket emit error:', err.message);
    }

    // Kick off DB save in background (non-blocking)
    // Dùng .catch() để không swallow lỗi — nếu DB fail, notification bị mất vĩnh viễn
    saveToDb().catch((err) => {
        console.error('[Notification] CRITICAL: DB save failed permanently:', {
            receiverId,
            type: notification.type,
            message: notification.message?.slice(0, 80),
            error: err.message,
        });
    });
};
