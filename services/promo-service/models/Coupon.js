import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    promotion: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion', required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    user: { type: String, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    discountAmount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['claimed', 'used', 'expired'],
        default: 'claimed',
    },
    usedAt: { type: Date, default: null },
}, { timestamps: true });

// Mỗi user chỉ claim 1 lần cho mỗi promotion
couponSchema.index({ promotion: 1, user: 1 }, { unique: true });
couponSchema.index({ code: 1, user: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
