import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createServiceClient } from '../../../shared/utils/serviceClient.js';

const adminRouter = express.Router();

// Service clients cho inter-service calls
const bookingClient = createServiceClient(
    process.env.BOOKING_SERVICE_URL || 'http://localhost:3000'
);
const hotelClient = createServiceClient(
    process.env.HOTEL_SERVICE_URL || 'http://localhost:3000'
);

// Middleware xác thực JWT cho admin
const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res
                .status(401)
                .json({ success: false, message: 'Token không tồn tại' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.role !== 'hotelOwner') {
            return res
                .status(403)
                .json({ success: false, message: 'Không có quyền admin' });
        }

        req.adminUser = user;
        next();
    } catch (error) {
        return res
            .status(401)
            .json({ success: false, message: 'Token không hợp lệ' });
    }
};

// POST /api/admin/login
adminRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email và mật khẩu là bắt buộc',
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || user.role !== 'hotelOwner') {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        if (!user.password) {
            return res.status(403).json({
                success: false,
                message:
                    'Tài khoản chưa thiết lập mật khẩu admin. Vui lòng sử dụng endpoint /setup-password.',
                requireSetup: true,
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng',
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// POST /api/admin/setup-password
adminRouter.post('/setup-password', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email và mật khẩu mới là bắt buộc',
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 8 ký tự',
            });
        }

        const user = await User.findOne({
            email,
            role: 'hotelOwner',
        }).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    'Không tìm thấy tài khoản hotel owner với email này',
            });
        }

        if (user.password) {
            return res.status(400).json({
                success: false,
                message:
                    'Mật khẩu đã được thiết lập. Sử dụng /change-password để thay đổi.',
            });
        }

        user.password = password;
        await user.save();

        res.json({
            success: true,
            message:
                'Thiết lập mật khẩu thành công. Bạn có thể đăng nhập admin.',
        });
    } catch (error) {
        console.error('Setup password error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PATCH /api/admin/change-password
adminRouter.patch('/change-password', adminAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại và mới là bắt buộc',
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu mới phải có ít nhất 8 ký tự',
            });
        }

        const user = await User.findById(req.adminUser._id).select(
            '+password'
        );

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng',
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /api/admin/dashboard — Thống kê tổng quan (gọi sang các service khác)
adminRouter.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();

        // Gọi sang các service khác để lấy số liệu
        let totalBookings = 0;
        let totalHotels = 0;
        let totalRooms = 0;

        try {
            const bookingStats = await bookingClient.get(
                '/internal/stats/count'
            );
            totalBookings = bookingStats.data?.count || 0;
        } catch {
            console.warn('Cannot reach booking service for dashboard stats');
        }

        try {
            const hotelStats = await hotelClient.get(
                '/internal/stats/count'
            );
            totalHotels = hotelStats.data?.hotelCount || 0;
            totalRooms = hotelStats.data?.roomCount || 0;
        } catch {
            console.warn('Cannot reach hotel service for dashboard stats');
        }

        res.json({
            success: true,
            data: { totalUsers, totalBookings, totalHotels, totalRooms },
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

export default adminRouter;
