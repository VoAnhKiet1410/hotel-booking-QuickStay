import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, ref: 'User' },
        room: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Room' },
        hotel: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Hotel' },
        checkInDate: { type: Date, required: true },
        checkOutDate: { type: Date, required: true },
        guests: { type: Number, required: true, min: 1 },
        totalPrice: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, default: null },
        discountAmount: { type: Number, default: 0 },
        couponCode: { type: String, default: null },
        status: { type: String, enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled'], default: 'pending' },
        paymentMethod: { type: String, default: 'payAtHotel' },
        isPaid: { type: Boolean, default: false },
        paidAt: { type: Date },
        stripeSessionId: { type: String },
        stripePaymentIntentId: { type: String },
        isRefunded: { type: Boolean, default: false },
        refundedAt: { type: Date },
        refundAmount: { type: Number, default: 0 },
        refundReason: { type: String },
        stripeRefundId: { type: String },

        // Trạng thái chi tiết của quy trình hoàn tiền (granular hơn isRefunded: boolean)
        // not_requested → pending → processing → completed / failed / rejected
        refundStatus: {
            type: String,
            enum: ['not_requested', 'pending', 'processing', 'completed', 'failed', 'rejected'],
            default: 'not_requested',
        },

        // Phân biệt hoàn một phần hay toàn bộ
        refundType: {
            type: String,
            enum: ['full', 'partial'],
        },

        // Lý do thất bại khi Stripe refund error
        refundFailReason: { type: String },

        checkedInAt: { type: Date },
        checkedOutAt: { type: Date },

        // IMP-4: Audit trail — ai đã thực hiện action
        checkedInBy: { type: String, ref: 'User' },   // owner/staff ID
        checkedOutBy: { type: String, ref: 'User' },   // owner/staff ID
        noShowBy: { type: String, ref: 'User' },       // owner/staff ID

        // No-show tracking (set bởi markNoShow controller hoặc nightAuditJob)
        noShowAt: { type: Date },
        cancellationReason: { type: String },

        // Yêu cầu đặc biệt của khách (ví dụ: tầng cao, view biển, phòng liền nhau)
        specialRequests: { type: String, default: '', maxlength: 500 },

        // Yêu cầu hoàn tiền từ guest (khi tự hủy Stripe booking)
        refundRequest: {
            requestedAt: { type: Date },
            requestedBy: { type: String }, // userId
            reason: { type: String },
            status: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending',
            },
            // Audit trail người xử lý
            approvedBy: { type: String },  // userId của owner/admin đã duyệt hoặc từ chối
            approvedAt: { type: Date },    // thời điểm duyệt
            rejectedReason: { type: String }, // lý do từ chối (nếu rejected)
        },
    },
    { timestamps: true },
);

// Indexes for better query performance
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ hotel: 1, createdAt: -1 });
bookingSchema.index({ room: 1, status: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ status: 1 });
// Index cho getRefundRequests: lọc booking theo hotel + refundRequest.status
bookingSchema.index({ hotel: 1, 'refundRequest.status': 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
