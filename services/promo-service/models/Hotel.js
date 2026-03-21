import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        address: { type: String, required: true },
        contact: { type: String, required: true },
        city: { type: String, required: true },
        owner: { type: String, required: true, ref: 'User' },
        description: { type: String, maxlength: 2000, default: '' },
        hostDescription: { type: String, maxlength: 500, default: 'Đã xác minh trên QuickStay · Phản hồi nhanh, thân thiện' },
        images: { type: [String], default: [] },
        starRating: { type: Number, min: 1, max: 5, default: 3 },
        amenities: { type: [String], default: [] },
        checkInTime: { type: String, default: '14:00' },
        checkOutTime: { type: String, default: '12:00' },
        // New multi-hotel fields
        theme: { type: String, enum: ['Urban Stays', 'County Stays'], default: 'Urban Stays' },
        wing: { type: String, enum: ['Modern Wing', 'Classic Wing'], default: 'Modern Wing' },
        regionDescription: { type: String, maxlength: 500, default: '' },
    },
    { timestamps: true },
);

hotelSchema.index({ city: 1 });
hotelSchema.index({ owner: 1 }); // NOT unique — one owner can have many hotels

const Hotel = mongoose.models.Hotel || mongoose.model('Hotel', hotelSchema);
export default Hotel;