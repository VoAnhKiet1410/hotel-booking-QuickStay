/**
 * Chat Socket State — module riêng để tránh circular dependency.
 *
 * chatController.js import từ đây (thay vì từ server.js)
 * → Phá vỡ vòng: server.js → chatRoutes → chatController → server.js
 */

let _io = null;
const userSocketMap = {};

/** Gọi 1 lần khi server khởi động */
export const setIo = (ioInstance) => {
    _io = ioInstance;
};

/** Lấy io instance */
export const getIo = () => _io;

/** Lấy socketId của receiver */
export const getReceiverSocketId = (receiverId) =>
    userSocketMap[String(receiverId)];

/** Đăng ký user ↔ socketId */
export const registerUser = (userId, socketId) => {
    userSocketMap[String(userId)] = socketId;
};

/** Xóa user khỏi map */
export const unregisterUser = (userId) => {
    delete userSocketMap[String(userId)];
};

/** Lấy toàn bộ map (để emit getOnlineUsers) */
export const getOnlineUserIds = () => Object.keys(userSocketMap);
