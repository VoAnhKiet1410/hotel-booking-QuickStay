import express from 'express';
import {
    accessConversation,
    getConversations,
    getMessages,
    sendMessage,
    markMessagesAsRead
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Conversation Routes
router.post('/conversations', protect, accessConversation);
router.get('/conversations', protect, getConversations);

// Message Routes
router.get('/messages/:conversationId', protect, getMessages);
router.post('/messages', protect, sendMessage);
router.put('/messages/:conversationId/read', protect, markMessagesAsRead);

export default router;
