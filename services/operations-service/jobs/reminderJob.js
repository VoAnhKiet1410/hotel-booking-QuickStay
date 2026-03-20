/**
 * reminderJob.js — Cron job gửi email nhắc nhở check-in 24h trước
 *
 * Chạy mỗi ngày lúc 9:00 sáng (Asia/Ho_Chi_Minh).
 * Tìm tất cả booking có checkInDate = ngày mai và status = 'confirmed'.
 * Gửi email nhắc nhở đến từng guest.
 *
 * Pattern: fire-and-forget (không block server start)
 */

import cron from 'node-cron';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { checkInReminderEmail } from '../utils/emailTemplates.js';
import { trySendEmail } from '../utils/emailHelper.js';

/**
 * Tính khoảng ngày: [đầu ngày mai, đầu ngày kia] theo UTC
 * → bắt đúng tất cả bookings có checkInDate thuộc về ngày mai
 */
const getTomorrowRange = () => {
    const now = new Date();

    // Đầu ngày mai (UTC+7 = UTC + 7h offset)
    const tomorrowStart = new Date(now);
    tomorrowStart.setUTCHours(tomorrowStart.getUTCHours() + 7); // chuyển sang giờ VN
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);
    // Convert ngược về UTC để query DB
    const startUTC = new Date(tomorrowStart.getTime() - 7 * 60 * 60 * 1000);

    const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000);

    return { startUTC, endUTC };
};

/**
 * Hàm chính: tìm bookings và gửi email nhắc nhở
 */
export const sendCheckInReminders = async () => {
    try {
        const { startUTC, endUTC } = getTomorrowRange();

        // Tìm tất cả booking confirmed có check-in ngày mai
        const bookings = await Booking.find({
            status: 'confirmed',
            checkInDate: { $gte: startUTC, $lt: endUTC },
        })
            .populate('room', 'roomType images hotel')
            .populate('hotel', 'name address');

        if (bookings.length === 0) {
            console.log(`[ReminderJob] ${new Date().toISOString()}: Không có booking check-in ngày mai.`);
            return;
        }

        console.log(`[ReminderJob] ${new Date().toISOString()}: Tìm thấy ${bookings.length} booking cần nhắc nhở.`);

        // Gửi email song song (Promise.allSettled để không fail toàn bộ nếu 1 email lỗi)
        const results = await Promise.allSettled(
            bookings.map(async (booking) => {
                const user = await User.findOne({ clerkId: booking.user });
                if (!user?.email) return;

                await trySendEmail(
                    checkInReminderEmail,
                    booking,
                    user,
                    `[ReminderJob] Check-in reminder #${booking._id.toString().slice(-8)}`,
                );
            }),
        );

        // Log kết quả
        const sent = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        console.log(`[ReminderJob] Gửi xong: ${sent} thành công, ${failed} thất bại.`);
    } catch (err) {
        console.error('[ReminderJob] Lỗi cron job:', err.message);
    }
};

/**
 * Khởi động cron schedule
 * Chạy lúc 9:00 sáng mỗi ngày (timezone Asia/Ho_Chi_Minh)
 *
 * Cú pháp: 'giây phút giờ ngày tháng thứ'
 * Không dùng 'giây' trong node-cron mặc định — chỉ 5 trường
 */
export const startReminderJob = () => {
    // Lúc 9:00 sáng mỗi ngày (giờ VN)
    cron.schedule('0 9 * * *', sendCheckInReminders, {
        timezone: 'Asia/Ho_Chi_Minh',
    });

    console.log('[ReminderJob] ✅ Cron job nhắc nhở check-in đã khởi động (9:00 AM mỗi ngày).');
};
