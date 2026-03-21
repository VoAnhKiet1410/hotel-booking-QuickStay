import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { getIo, getReceiverSocketId } from '../configs/chatSocket.js';

// @desc    Lấy hoặc tạo mới cuộc rò chuyện (Conversation) giữa 2 user
// @route   POST /api/conversations
// @access  Private
export const accessConversation = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { receiverId } = req.body; // User ID (Clerk _id) của chủ nhà (hoặc ngược lại khách)

        if (!receiverId) {
            return res.status(400).json({ success: false, message: "Yêu cầu receiverId." });
        }

        if (currentUserId.toString() === receiverId.toString()) {
            return res.status(400).json({ success: false, message: "Không thể tự chat với chính mình." });
        }

        // Tìm conversation hiện tại giữa currentUserId và receiverId (bất kể thứ tự)
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, receiverId] }
        })
            .populate("participants", "username imageUrl role")
            .lean();

        if (conversation) {
            return res.json({ success: true, data: conversation });
        }

        // Nếu chưa có thì tạo mới
        const newConversation = await Conversation.create({
            participants: [currentUserId, receiverId]
        });

        // Bóc populate ra sau khi tạo
        const populatedConversation = await Conversation.findById(newConversation._id)
            .populate("participants", "username imageUrl role")
            .lean();

        return res.status(201).json({ success: true, data: populatedConversation });
    } catch (error) {
        console.error("accessConversation Error:", error);
        return res.status(500).json({ success: false, message: "Lỗi server." });
    }
};

// @desc    Lấy tất cả các cuộc trò chuyện của User hiện tại (cho trang Inbox)
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        const conversations = await Conversation.find({
            participants: { $in: [currentUserId] }
        })
            .populate("participants", "username imageUrl role")
            .sort({ updatedAt: -1 })
            .lean();

        // Enrich with lastMessage and unreadCount
        const enrichedConversations = await Promise.all(
            conversations.map(async (conv) => {
                // Get the last message
                const lastMessage = await Message.findOne({ conversationId: conv._id })
                    .sort({ createdAt: -1 })
                    .lean();

                // Get unread count (messages sent by the other participant(s))
                const unreadCount = await Message.countDocuments({
                    conversationId: conv._id,
                    senderId: { $ne: currentUserId },
                    isRead: false
                });

                return {
                    ...conv,
                    lastMessage: lastMessage || null,
                    unreadCount
                };
            })
        );

        // Sort again by lastMessage creation time (fallback to updatedAt)
        enrichedConversations.sort((a, b) => {
            const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(a.updatedAt);
            const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(b.updatedAt);
            return dateB - dateA;
        });

        return res.json({ success: true, data: enrichedConversations });
    } catch (error) {
        console.error("getConversations Error:", error);
        return res.status(500).json({ success: false, message: "Lỗi server." });
    }
};

// @desc    Lấy tin nhắn trong cuộc trò chuyện (hỗ trợ cursor pagination)
// @route   GET /api/messages/:conversationId?limit=50&before=msgId
// @access  Private
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user._id;
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const before = req.query.before; // cursor: _id of oldest message client has

        // Kiểm tra quyền (user có trong conversation không)
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện." });
        }

        const isParticipant = conversation.participants.some(
            p => p.toString() === currentUserId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: "Không có quyền truy cập cuộc trò chuyện này." });
        }

        // Build query with cursor
        const filter = { conversationId };
        if (before) {
            filter._id = { $lt: before };
        }

        // Fetch limit + 1 to determine hasMore
        const messages = await Message.find(filter)
            .populate("senderId", "username imageUrl role")
            .sort({ createdAt: -1 }) // newest first for pagination
            .limit(limit + 1)
            .lean();

        const hasMore = messages.length > limit;
        if (hasMore) messages.pop(); // remove the extra one

        // Reverse to chronological order (oldest first like messenger)
        messages.reverse();

        return res.json({ success: true, data: messages, hasMore });
    } catch (error) {
        console.error("getMessages Error:", error);
        return res.status(500).json({ success: false, message: "Lỗi server." });
    }
};

// @desc    Gửi 1 tin nhắn vào cuộc trò chuyện
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { conversationId, text } = req.body;
        const senderId = req.user._id;

        if (!conversationId || !text) {
            return res.status(400).json({ success: false, message: "Yêu cầu text và conversationId." });
        }

        // Verify sender is participant of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện." });
        }
        const isSenderParticipant = conversation.participants.some(
            p => p.toString() === senderId.toString()
        );
        if (!isSenderParticipant) {
            return res.status(403).json({ success: false, message: "Không có quyền gửi tin nhắn trong cuộc trò chuyện này." });
        }

        // Tạo tin nhắn mới
        let message = await Message.create({
            senderId,
            text,
            conversationId
        });

        // Populate tin nhắn để trả về cho Frontend hiển thị xịn xò
        message = await message.populate('senderId', 'username imageUrl role');

        // Cập nhật updatedAt của Conversation
        await Conversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() });

        // ── Real-time: Emit tin nhắn mới tới receiver ──
        const receiverId = conversation.participants.find(
            p => p.toString() !== senderId.toString()
        );
        if (receiverId) {
            const receiverSocketId = getReceiverSocketId(receiverId.toString());
            if (receiverSocketId) {
                getIo().to(receiverSocketId).emit('newMessage', {
                    ...message.toObject(),
                    conversationId: conversationId.toString(),
                });
            }
        }

        return res.status(201).json({ success: true, data: message });
    } catch (error) {
        console.error("sendMessage Error:", error);
        return res.status(500).json({ success: false, message: "Lỗi server." });
    }
};

// @desc    Đánh dấu tin nhắn trong cuộc trò chuyện đã đọc
// @route   PUT /api/messages/:conversationId/read
// @access  Private
export const markMessagesAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const currentUserId = req.user._id;

        // Chỉ đánh dấu các tin nhắn gửi đến mình (không phải do mình gửi)
        const updatedMessages = await Message.updateMany(
            {
                conversationId,
                senderId: { $ne: currentUserId },
                isRead: false
            },
            {
                $set: { isRead: true }
            }
        );

        // ── Real-time: Notify sender that messages have been read ──
        if (updatedMessages.modifiedCount > 0) {
            const conversation = await Conversation.findById(conversationId);
            if (conversation) {
                const senderId = conversation.participants.find(
                    p => p.toString() !== currentUserId.toString()
                );
                if (senderId) {
                    const senderSocketId = getReceiverSocketId(senderId.toString());
                    if (senderSocketId) {
                        getIo().to(senderSocketId).emit('messagesRead', {
                            conversationId: conversationId.toString(),
                            readBy: currentUserId.toString(),
                        });
                    }
                }
            }
        }

        return res.json({ success: true, data: updatedMessages });
    } catch (error) {
        console.error("markMessagesAsRead Error:", error);
        return res.status(500).json({ success: false, message: "Lỗi server." });
    }
};
