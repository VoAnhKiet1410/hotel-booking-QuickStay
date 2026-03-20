import mongoose from 'mongoose';

/**
 * Subscriber Model — Lưu thông tin người đăng ký nhận email ưu đãi.
 * Hỗ trợ preferences để gửi email phù hợp sở thích.
 */
const subscriberSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
        },
        status: {
            type: String,
            enum: ['active', 'unsubscribed'],
            default: 'active',
        },
        subscribedAt: {
            type: Date,
            default: Date.now,
        },
        unsubscribedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true },
);

// Index cho truy vấn nhanh theo status (email đã có unique index)
subscriberSchema.index({ status: 1 });

const Subscriber = mongoose.model('Subscriber', subscriberSchema);

export default Subscriber;
