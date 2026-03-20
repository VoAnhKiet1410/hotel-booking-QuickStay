import Subscriber from '../models/Subscriber.js';
import { sendEmail } from '../configs/email.js';
import { welcomeSubscriberEmail } from '../utils/emailTemplates.js';

/**
 * Đăng ký nhận email ưu đãi.
 * POST /api/subscribers
 * Body: { email: string }
 * Public route — không cần auth.
 */
export const subscribe = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email hợp lệ.',
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check duplicate — nếu đã đăng ký và active
        const existing = await Subscriber.findOne({ email: normalizedEmail });

        if (existing) {
            if (existing.status === 'active') {
                return res.status(409).json({
                    success: false,
                    message: 'Email này đã được đăng ký nhận ưu đãi.',
                });
            }

            // Re-subscribe nếu đã unsubscribed trước đó
            existing.status = 'active';
            existing.subscribedAt = new Date();
            existing.unsubscribedAt = null;
            await existing.save();

            return res.json({
                success: true,
                message: 'Chào mừng bạn quay lại! Bạn sẽ nhận được ưu đãi mới nhất.',
            });
        }

        // Tạo subscriber mới
        const subscriber = await Subscriber.create({ email: normalizedEmail });

        // Gửi welcome email — fire and forget, không block response
        try {
            const emailData = welcomeSubscriberEmail(normalizedEmail);
            await sendEmail({
                to: normalizedEmail,
                subject: emailData.subject,
                html: emailData.html,
                text: emailData.text,
            });
        } catch (emailError) {
            console.error('Welcome email failed:', emailError.message);
            // Không throw — subscriber vẫn được lưu thành công
        }

        return res.status(201).json({
            success: true,
            message: 'Đăng ký thành công! Kiểm tra email để nhận ưu đãi đầu tiên.',
        });
    } catch (error) {
        console.error('Subscribe error:', error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Email này đã được đăng ký nhận ưu đãi.',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        });
    }
};

/**
 * Lấy tổng số subscriber active (cho social proof).
 * GET /api/subscribers/count
 * Public route.
 */
export const getSubscriberCount = async (req, res) => {
    try {
        const count = await Subscriber.countDocuments({ status: 'active' });

        return res.json({
            success: true,
            count,
        });
    } catch (error) {
        console.error('Get subscriber count error:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi.',
        });
    }
};
