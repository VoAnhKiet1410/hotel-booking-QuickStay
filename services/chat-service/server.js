/**
 * Chat Service — Real-time messaging.
 * Port: 3006
 */

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import chatRouter from './routes/chatRoutes.js';
import {
    setIo,
    getReceiverSocketId,
    registerUser,
    unregisterUser,
    getOnlineUserIds,
} from './configs/chatSocket.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3006;

// Socket.IO cho chat
const io = new Server(httpServer, {
    cors: {
        origin: [
            process.env.CLIENT_URL,
            'http://localhost:5173',
            'http://localhost:5174',
        ]
            .filter(Boolean)
            .map((url) => url.trim().replace(/\/+$/, '')),
        methods: ['GET', 'POST'],
    },
});

// Lưu io vào chatSocket module để controllers dùng (tránh circular dep)
setIo(io);

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId && userId !== 'undefined') {
        registerUser(userId, socket.id);
    }

    io.emit('getOnlineUsers', getOnlineUserIds());

    socket.on('joinConversation', (conversationId) => {
        if (conversationId) socket.join(`conv_${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId) => {
        if (conversationId) socket.leave(`conv_${conversationId}`);
    });

    socket.on('typing', ({ conversationId, receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('typing', {
                conversationId,
                senderId: userId,
            });
        }
    });

    socket.on('stopTyping', ({ conversationId, receiverId }) => {
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('stopTyping', {
                conversationId,
                senderId: userId,
            });
        }
    });

    socket.on('disconnect', () => {
        if (userId) {
            unregisterUser(userId);
            io.emit('getOnlineUsers', getOnlineUserIds());
        }
    });
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Inject io vào req để controllers dùng
app.use((req, res, next) => {
    req.io = io;
    req.getReceiverSocketId = getReceiverSocketId;
    next();
});

app.use('/api/chat', chatRouter);

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'chat-service',
        timestamp: new Date().toISOString(),
    });
});

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error('Chat service error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            family: 4,
        });
        console.log('Chat Service — MongoDB connected');

        httpServer.listen(PORT, () => {
            console.log(`💬 Chat Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Chat Service startup failed:', error.message);
        process.exit(1);
    }
};

startServer();
