/**
 * NightAuditLog.js — Lưu lại kết quả mỗi lần Night Audit chạy
 *
 * Mỗi document = 1 lần audit (cron tự động hoặc owner trigger thủ công).
 * Dùng để owner xem lịch sử, kiểm tra kết quả, debug nếu cần.
 */
import mongoose from 'mongoose';

const nightAuditLogSchema = new mongoose.Schema(
    {
        // Hotel mà audit áp dụng (null nếu chạy global cron)
        hotel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hotel',
            default: null,
        },

        // Ai trigger: 'cron' (tự động) hoặc 'manual' (owner bấm nút)
        triggeredBy: {
            type: String,
            enum: ['cron', 'manual'],
            default: 'cron',
        },

        // User ID của owner trigger (chỉ khi manual)
        triggeredByUser: {
            type: String,
            default: null,
        },

        // Ngày audit áp dụng (business date, không phải thời điểm chạy)
        auditDate: {
            type: Date,
            required: true,
        },

        // Thời điểm bắt đầu và kết thúc
        startedAt: {
            type: Date,
            required: true,
        },
        completedAt: {
            type: Date,
        },

        // Thời gian xử lý (ms)
        durationMs: {
            type: Number,
            default: 0,
        },

        // Kết quả tổng hợp
        status: {
            type: String,
            enum: ['running', 'completed', 'failed'],
            default: 'running',
        },

        // Kết quả No-Show
        noShow: {
            total: { type: Number, default: 0 },
            succeeded: { type: Number, default: 0 },
            failed: { type: Number, default: 0 },
            bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
        },

        // Kết quả Auto-Checkout
        autoCheckout: {
            total: { type: Number, default: 0 },
            succeeded: { type: Number, default: 0 },
            failed: { type: Number, default: 0 },
            bookingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
        },

        // Tổng kết doanh thu trong ngày
        dailyRevenue: {
            totalBookings: { type: Number, default: 0 },
            totalRevenue: { type: Number, default: 0 },
            paidBookings: { type: Number, default: 0 },
            unpaidBookings: { type: Number, default: 0 },
        },

        // Tổng kết phòng
        roomStatus: {
            totalRooms: { type: Number, default: 0 },
            occupied: { type: Number, default: 0 },
            available: { type: Number, default: 0 },
            dirty: { type: Number, default: 0 },
            outOfOrder: { type: Number, default: 0 },
        },

        // Lỗi nếu có
        error: {
            type: String,
            default: null,
        },
    },
    { timestamps: true },
);

// Indexes
nightAuditLogSchema.index({ hotel: 1, auditDate: -1 });
nightAuditLogSchema.index({ auditDate: -1 });
nightAuditLogSchema.index({ status: 1 });

const NightAuditLog = mongoose.models.NightAuditLog || mongoose.model('NightAuditLog', nightAuditLogSchema);

export default NightAuditLog;
