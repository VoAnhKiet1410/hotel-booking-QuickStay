import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        username: { type: String, required: true },
        email: { type: String, required: true },
        imageUrl: { type: String, required: true },
        role: { type: String, enum: ['user', 'hotelOwner'], default: 'user' },
        recentSearchedCities: { type: [String], default: [] },
        password: { type: String, select: false },
    },
    { timestamps: true }
);

// Hash password trước khi lưu (nếu có thay đổi)
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// So sánh password
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
