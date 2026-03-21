import mongoose from 'mongoose';

/**
 * Model lưu trữ thông báo persistent trong MongoDB.
 * Thay thế việc chỉ lưu trong React state (mất khi reload).
 */
const notificationSchema = new mongoose.Schema(
    {
        // Người nhận thông báo (userId từ Clerk)
        receiverId: { type: String, required: true, index: true },

        // Loại thông báo — mapping với NotificationDropdown types
        type: {
            type: String,
            required: true,
            enum: [
                // Owner nhận
                'new_booking',
                'booking_cancelled',          // guest hủy
                'booking_refund_requested',   // guest hủy + muốn hoàn tiền
                'new_message',
                // Guest nhận
                'booking_pending',            // vừa tạo booking
                'booking_confirmed',
                'booking_checked_in',
                'booking_completed',
                'booking_cancelled_by_owner',
                'booking_refunded',
                'payment_success',
                'room_soldout',
            ],
        },

        // Nội dung thông báo
        message: { type: String, required: true },

        // Metadata bổ sung (bookingId, guestName, totalPrice, ...)
        data: { type: mongoose.Schema.Types.Mixed, default: {} },

        // Trạng thái đã đọc
        isRead: { type: Boolean, default: false },
        readAt: { type: Date },
    },
    {
        timestamps: true, // createdAt, updatedAt
    }
);

// TTL index: tự động xóa notifications cũ hơn 30 ngày
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Composite index cho query phổ biến: lấy notifications chưa đọc theo user
notificationSchema.index({ receiverId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
