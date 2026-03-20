import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minNights: { type: Number, default: 1, min: 1 },
    maxUses: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    applicableRoomTypes: [{ type: String }],
    image: { type: String, default: '' },
    couponCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    category: {
        type: String,
        enum: ['family', 'couple', 'luxury', 'earlybird', 'seasonal', 'other'],
        default: 'other',
    },
}, { timestamps: true });

// Virtual: còn hiệu lực không
promotionSchema.virtual('isValid').get(function () {
    const now = new Date();
    return this.isActive && now >= this.validFrom && now <= this.validTo &&
        (this.maxUses === null || this.usedCount < this.maxUses);
});

// Virtual: tỉ lệ đã dùng (cho progress bar)
promotionSchema.virtual('usagePercent').get(function () {
    if (!this.maxUses) return 0;
    return Math.round((this.usedCount / this.maxUses) * 100);
});

promotionSchema.set('toJSON', { virtuals: true });
promotionSchema.set('toObject', { virtuals: true });

promotionSchema.index({ hotel: 1, isActive: 1, validTo: 1 });

const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;
