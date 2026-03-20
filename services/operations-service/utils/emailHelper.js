/**
 * emailHelper — Booking Service version.
 * Gọi Notification Service để gửi email thay vì import email config trực tiếp.
 */

import { createServiceClient } from '../../../shared/utils/serviceClient.js';

const notificationClient = createServiceClient(
    process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005'
);

/**
 * Gửi email an toàn qua Notification Service.
 * @param {Function} templateFn - Hàm tạo email template (data, user) => { subject, html, text }
 * @param {object} data - Dữ liệu truyền vào templateFn (booking)
 * @param {object} user - User nhận email
 * @param {string} label - Nhãn log cho debug
 */
export const trySendEmail = async (
    templateFn,
    data,
    user,
    label = 'Email'
) => {
    if (!user?.email) return;

    try {
        const emailData = templateFn(data, user);
        await notificationClient.post('/internal/send-email', {
            to: user.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
        });
    } catch (error) {
        console.error(`${label} error:`, error.message);
    }
};
