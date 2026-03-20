import Notification from '../models/Notification.js';

/**
 * GET /api/notifications
 * Lấy danh sách notifications của user hiện tại (50 cái mới nhất).
 */
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        const notifications = await Notification.find({ receiverId: userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        const unreadCount = await Notification.countDocuments({
            receiverId: userId,
            isRead: false,
        });

        return res.json({
            success: true,
            data: { notifications, unreadCount },
        });
    } catch (error) {
        console.error('getNotifications error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PATCH /api/notifications/read-all
 * Đánh dấu tất cả notifications là đã đọc.
 */
export const markAllRead = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        await Notification.updateMany(
            { receiverId: userId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        return res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
    } catch (error) {
        console.error('markAllRead error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PATCH /api/notifications/:id/read
 * Đánh dấu một notification cụ thể là đã đọc.
 */
export const markOneRead = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, receiverId: userId },
            { $set: { isRead: true, readAt: new Date() } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        return res.json({ success: true, data: notification });
    } catch (error) {
        console.error('markOneRead error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * DELETE /api/notifications
 * Xóa tất cả notifications của user hiện tại.
 */
export const clearAllNotifications = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        await Notification.deleteMany({ receiverId: userId });
        return res.json({ success: true, message: 'Đã xóa tất cả thông báo' });
    } catch (error) {
        console.error('clearAllNotifications error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
