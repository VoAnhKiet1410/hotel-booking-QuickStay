import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
    {
        hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
        roomType: { type: String, required: true },
        pricePerNight: { type: Number, required: true },
        capacity: { type: Number, required: true },
        totalRooms: { type: Number, required: true, default: 1, min: 1 },
        amenities: { type: [String], default: [] },
        images: { type: [String], default: [] },
        status: { type: String, enum: ['open', 'paused', 'soldout'], default: 'open' },
        // New fields for room details
        bed: { type: String, default: '' },
        area: { type: String, default: '' },
        description: { type: String, maxlength: 1000, default: '' },
        wing: { type: String, default: '' },
        // Housekeeping fields — trạng thái vệ sinh (tách biệt status bán)
        housekeepingStatus: {
            type: String,
            enum: ['clean', 'dirty', 'inspecting', 'out_of_order'],
            default: 'clean',
        },
        housekeepingNote: { type: String, maxlength: 500, default: '' },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

// Virtual: backward-compatible isAvailable getter
roomSchema.virtual('isAvailable').get(function () {
    return this.status === 'open';
});

// Indexes for better query performance
roomSchema.index({ hotel: 1 });
roomSchema.index({ status: 1, createdAt: -1 });
roomSchema.index({ pricePerNight: 1 });

const Room = mongoose.model('Room', roomSchema);

export default Room;
