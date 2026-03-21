import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: String, // Reference to User's _id (Clerk ID)
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Optimize query for finding conversation between 2 particular users
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
