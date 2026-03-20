/**
 * Gửi email an toàn — bắt lỗi và log thay vì crash.
 *
 * Trong kiến trúc microservice, hàm này nhận sendEmailFn inject
 * thay vì import trực tiếp từ configs/email.js (mỗi service có config riêng).
 *
 * @param {Function} templateFn — Hàm tạo email template (data, user) => { subject, html, text }
 * @param {object} data — Dữ liệu truyền vào templateFn (booking, etc.)
 * @param {object} user — User nhận email
 * @param {string} label — Nhãn log cho debug (vd: 'Booking confirmation')
 * @param {Function} sendEmailFn — Hàm gửi email ({ to, subject, html, text }) => Promise
 */
export const trySendEmail = async (templateFn, data, user, label = 'Email', sendEmailFn) => {
    if (!user?.email) return;

    if (!sendEmailFn) {
        console.warn(`[${label}] No sendEmailFn provided, skipping email`);
        return;
    }

    try {
        const emailData = templateFn(data, user);
        const result = await sendEmailFn({
            to: user.email,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
        });
        if (!result.success) {
            console.error(`${label} failed:`, result.error || result.message);
        }
    } catch (error) {
        console.error(`${label} error:`, error.message);
    }
};
