import { Server } from "socket.io";

let io;
const userSocketMap = {}; // { clerkUserId: socketId }

export const initSocket = (server) => {
    const allowedOrigins = [
        process.env.CLIENT_URL,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
    ].filter(Boolean).map(url => url.trim().replace(/\/+$/, ''));

    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (allowedOrigins.includes(origin)) return callback(null, true);
                // Cho phép tất cả Vercel preview/production URLs
                if (origin.endsWith('.vercel.app')) return callback(null, true);
                // Cho phép Railway internal URLs
                if (origin.endsWith('.railway.app')) return callback(null, true);
                return callback(new Error('Not allowed by Socket.IO CORS'));
            },
            methods: ['GET', 'POST'],
            credentials: true,
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected", socket.id);

        const userId = socket.handshake.query.userId;

        if (userId && userId !== "undefined") {
            userSocketMap[userId] = socket.id;
            console.log(`User mapped: ${userId} -> ${socket.id}`);
        }

        // Emit online users
        io.emit("getOnlineUsers", Object.keys(userSocketMap));

        // --- Conversation room management ---
        socket.on("joinConversation", (conversationId) => {
            if (conversationId) {
                socket.join(`conv_${conversationId}`);
            }
        });

        socket.on("leaveConversation", (conversationId) => {
            if (conversationId) {
                socket.leave(`conv_${conversationId}`);
            }
        });

        // --- Typing indicators ---
        socket.on("typing", ({ conversationId, receiverId }) => {
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("typing", {
                    conversationId,
                    senderId: userId,
                });
            }
        });

        socket.on("stopTyping", ({ conversationId, receiverId }) => {
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("stopTyping", {
                    conversationId,
                    senderId: userId,
                });
            }
        });

        // --- Disconnect ---
        socket.on("disconnect", () => {
            console.log("A user disconnected", socket.id);
            if (userId) {
                delete userSocketMap[userId];
                io.emit("getOnlineUsers", Object.keys(userSocketMap));
            }
        });
    });

    return io;
};

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
};

export const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
