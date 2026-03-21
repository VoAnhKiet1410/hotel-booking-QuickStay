import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        user: { type: String, required: true, ref: 'User' },
        booking: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Booking' },
        room: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Room' },
        hotel: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Hotel' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true, maxlength: 1000 },
        cleanliness: { type: Number, min: 1, max: 5 },
        service: { type: Number, min: 1, max: 5 },
        location: { type: Number, min: 1, max: 5 },
        valueForMoney: { type: Number, min: 1, max: 5 },
        isVerified: { type: Boolean, default: true },
        helpfulCount: { type: Number, default: 0 },
        helpfulVotes: [{ type: String }],
        response: {
            comment: { type: String },
            respondedBy: { type: String, ref: 'User' },
            respondedAt: { type: Date },
        },
    },
    { timestamps: true },
);

// Indexes
reviewSchema.index({ hotel: 1, createdAt: -1 });
reviewSchema.index({ room: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ booking: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });

// Prevent duplicate reviews per booking
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
