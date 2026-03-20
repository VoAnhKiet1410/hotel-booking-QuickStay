// Backend Email Templates for Nodemailer — Modern Editorial Luxury
// Typography: Playfair Display (headings), DM Sans (body), DM Mono (labels)
// Fallback: Georgia, Segoe UI, Menlo for email clients without Google Fonts

const googleFontsImport = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
`;

// Font stacks with robust fallbacks
const FONTS = {
    heading: "'Playfair Display', Georgia, 'Palatino Linotype', 'Book Antiqua', serif",
    body: "'DM Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    mono: "'DM Mono', Menlo, Consolas, 'Liberation Mono', monospace",
};

const baseCSS = `
    ${googleFontsImport}
    body {
        font-family: ${FONTS.body};
        line-height: 1.7; color: #1a1a1a; background: #f5f3ef;
        margin: 0; padding: 24px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
    .container {
        max-width: 560px; margin: 0 auto; background: #ffffff;
        border: 1px solid #d4d0c8;
    }
    .header {
        padding: 28px 36px; text-align: center;
        border-bottom: 1px solid #e8e5e0;
    }
    .logo {
        display: inline-block; border: 2px solid #1a1a1a;
        padding: 8px 16px; font-family: ${FONTS.heading};
        font-size: 22px; font-weight: 700; color: #1a1a1a;
        letter-spacing: 0.02em;
    }
    .brand-text {
        display: block; margin-top: 8px;
        font-family: ${FONTS.mono}; font-size: 11px;
        letter-spacing: 0.2em; text-transform: uppercase; color: #999;
    }
    .hero {
        padding: 36px 36px 20px; text-align: center;
        background: #faf9f6;
        border-bottom: 1px solid #e8e5e0;
    }
    .status-badge {
        display: inline-block; padding: 6px 16px;
        font-family: ${FONTS.mono}; font-size: 11px;
        letter-spacing: 0.15em; text-transform: uppercase;
        margin-bottom: 16px;
    }
    .status-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .status-pending { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
    .status-cancelled { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
    .hero h1 {
        font-family: ${FONTS.heading}; font-size: 24px; font-weight: 600;
        color: #1a1a1a; margin: 0 0 6px 0; letter-spacing: -0.01em;
    }
    .hero p {
        font-size: 13px; color: #888; margin: 0;
        font-family: ${FONTS.body}; font-weight: 400;
    }
    .content { padding: 28px 36px; }
    .greeting {
        font-size: 15px; color: #444; margin-bottom: 24px;
        line-height: 1.7; font-family: ${FONTS.body};
    }
    .card {
        border: 1px solid #e8e5e0; padding: 0; margin-bottom: 24px;
    }
    .card-header {
        padding: 12px 20px; border-bottom: 1px solid #e8e5e0;
        background: #faf9f6;
    }
    .card-title {
        font-family: ${FONTS.mono}; font-size: 11px;
        letter-spacing: 0.15em; text-transform: uppercase;
        color: #999; margin: 0;
    }
    .card-body { padding: 0; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #f0eeea; }
    tr:last-child { border-bottom: none; }
    td {
        padding: 11px 20px; font-size: 14px; vertical-align: top;
    }
    .label {
        color: #888; width: 40%;
        font-family: ${FONTS.mono}; font-size: 12px;
        letter-spacing: 0.04em;
    }
    .value {
        color: #1a1a1a; font-weight: 500; text-align: right;
        font-family: ${FONTS.body};
    }
    .total-row {
        border-top: 2px solid #1a1a1a !important;
        background: #faf9f6;
    }
    .total-row td { padding: 14px 20px; vertical-align: middle; }
    .total-label {
        font-family: ${FONTS.mono}; font-size: 11px;
        letter-spacing: 0.12em; text-transform: uppercase;
        color: #666; font-weight: 500;
    }
    .total-value {
        font-family: ${FONTS.heading}; font-size: 22px;
        font-weight: 700; color: #1a1a1a;
    }
    .note {
        border: 1px solid #e8e5e0; padding: 14px 18px;
        font-size: 14px; color: #666; margin-bottom: 24px;
        font-family: ${FONTS.body}; line-height: 1.6;
        background: #faf9f6;
    }
    .note-warn {
        border-left: 3px solid #f59e0b;
        background: #fffbeb; color: #92400e;
    }
    .note-refund {
        border-left: 3px solid #10b981;
        background: #ecfdf5; color: #065f46;
    }
    .buttons { text-align: center; margin: 28px 0; }
    .btn {
        display: inline-block; padding: 12px 28px; text-decoration: none;
        font-family: ${FONTS.body}; font-size: 12px;
        letter-spacing: 0.1em; text-transform: uppercase;
        font-weight: 600;
    }
    .btn-primary {
        background: #1a1a1a; color: #fff !important;
        border: 2px solid #1a1a1a;
    }
    .btn-secondary {
        background: transparent; color: #1a1a1a !important;
        border: 1px solid #1a1a1a; margin-left: 10px;
    }
    .btn-green {
        background: #065f46; color: #fff !important;
        border: 2px solid #065f46;
    }
    .divider {
        height: 1px; background: #e8e5e0; margin: 0;
    }
    .contact {
        text-align: center; padding: 20px 36px;
        border-top: 1px solid #e8e5e0;
    }
    .contact-text {
        font-family: ${FONTS.mono}; font-size: 11px;
        letter-spacing: 0.08em; text-transform: uppercase;
        color: #aaa; margin-bottom: 6px;
    }
    .contact-link {
        color: #1a1a1a; text-decoration: none;
        font-family: ${FONTS.body}; font-size: 14px;
        font-weight: 500;
    }
    .footer {
        text-align: center; padding: 20px 36px;
        border-top: 1px solid #e8e5e0;
        font-family: ${FONTS.mono}; font-size: 11px;
        letter-spacing: 0.1em; text-transform: uppercase;
        color: #bbb;
    }
    @media only screen and (max-width: 600px) {
        body { padding: 12px; }
        .hero, .content, .contact, .footer { padding-left: 20px; padding-right: 20px; }
        .card-header, td { padding-left: 16px; padding-right: 16px; }
        .btn-secondary { margin: 10px 0 0 0; display: block; }
    }
`;

const baseLayout = ({ statusBadge, title, subtitle, content, extraCSS = '' }) => `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>${baseCSS}${extraCSS}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Q</div>
            <span class="brand-text">QuickStay Hotels</span>
        </div>
        <div class="hero">
            ${statusBadge}
            <h1>${title}</h1>
            <p>${subtitle}</p>
        </div>
        <div class="content">${content}</div>
        <div class="contact">
            <p class="contact-text">Hỗ trợ khách hàng</p>
            <a href="mailto:support@quickstay.com" class="contact-link">support@quickstay.com</a>
        </div>
        <div class="footer">
            <p style="margin: 4px 0;">Trân trọng — QuickStay Team</p>
            <p style="margin: 8px 0 0 0;">© 2026 QuickStay. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

const bookingInfoTable = (booking, hotelName, roomType, checkInDate, checkOutDate, nights) => `
<div class="card">
    <div class="card-header">
        <p class="card-title">Thông tin đặt phòng</p>
    </div>
    <div class="card-body">
        <table>
            <tr><td class="label">Mã đặt phòng</td><td class="value">#${booking._id.toString().slice(-8).toUpperCase()}</td></tr>
            <tr><td class="label">Khách sạn</td><td class="value">${hotelName}</td></tr>
            <tr><td class="label">Loại phòng</td><td class="value">${roomType}</td></tr>
            <tr><td class="label">Số khách</td><td class="value">${booking.guests} người</td></tr>
            <tr><td class="label">Số đêm</td><td class="value">${nights} đêm</td></tr>
            <tr><td class="label">Check-in</td><td class="value">${checkInDate}</td></tr>
            <tr><td class="label">Check-out</td><td class="value">${checkOutDate}</td></tr>
            <tr class="total-row"><td class="total-label">Tổng thanh toán</td><td class="total-value">${booking.totalPrice.toLocaleString('vi-VN')} ₫</td></tr>
        </table>
    </div>
</div>`;

const bookingInfoText = (booking, hotelName, roomType, checkInDate, checkOutDate, nights) => `
- Mã: #${booking._id.toString().slice(-8).toUpperCase()}
- Khách sạn: ${hotelName}
- Loại phòng: ${roomType}
- Check-in: ${checkInDate}
- Check-out: ${checkOutDate}
- Số khách: ${booking.guests} người
- Số đêm: ${nights} đêm
- Tổng: ${booking.totalPrice.toLocaleString('vi-VN')} ₫`;

const extractBookingData = (booking) => {
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('vi-VN');
    const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('vi-VN');
    const hotelName = booking.hotel?.name || 'Hotel';
    const roomType = booking.room?.roomType || 'Room';
    const nights = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
    return { checkInDate, checkOutDate, hotelName, roomType, nights };
};

// ─── Payment Success Email ───
export const paymentSuccessEmail = (booking, user) => {
    const { checkInDate, checkOutDate, hotelName, roomType, nights } = extractBookingData(booking);

    const content = `
        <p class="greeting">
            Xin chào <strong>${user.username}</strong>,<br><br>
            Cảm ơn bạn đã hoàn tất thanh toán! Đặt phòng của bạn tại <strong>${hotelName}</strong> đã được xác nhận thành công.
        </p>
        ${bookingInfoTable(booking, hotelName, roomType, checkInDate, checkOutDate, nights)}
        <div class="note">
            Vui lòng mang theo <strong>CMND/CCCD</strong> hoặc <strong>Hộ chiếu</strong> khi check-in vào ngày ${checkInDate}.
        </div>
        <div class="buttons">
            <a href="${process.env.CLIENT_URL}/my-bookings" class="btn btn-primary">Xem đặt phòng →</a>
            <a href="${process.env.CLIENT_URL}/rooms" class="btn btn-secondary">Đặt thêm phòng</a>
        </div>`;

    return {
        subject: `Thanh toán thành công — ${hotelName}`,
        html: baseLayout({
            statusBadge: '<div class="status-badge status-success">Đã xác nhận</div>',
            title: 'Thanh toán thành công',
            subtitle: 'Đặt phòng của bạn đã được xác nhận',
            content
        }),
        text: `Xin chào ${user.username},\n\nThanh toán của bạn đã thành công!\n\nThông tin đặt phòng:\n${bookingInfoText(booking, hotelName, roomType, checkInDate, checkOutDate, nights)}\n\nVui lòng mang CMND/CCCD khi check-in.\n\nTrân trọng,\nQuickStay Team`,
    };
};

// ─── Booking Confirmation Email ───
export const bookingConfirmationEmail = (booking, user) => {
    const { checkInDate, checkOutDate, hotelName, roomType, nights } = extractBookingData(booking);

    const content = `
        <p class="greeting">
            Xin chào <strong>${user.username}</strong>,<br><br>
            Yêu cầu đặt phòng của bạn tại <strong>${hotelName}</strong> đã được tạo thành công. Vui lòng hoàn tất thanh toán để xác nhận đặt phòng.
        </p>
        ${bookingInfoTable(booking, hotelName, roomType, checkInDate, checkOutDate, nights)}
        <div class="note note-warn">
            <strong>Lưu ý:</strong> Đặt phòng của bạn chưa được xác nhận. Vui lòng hoàn tất thanh toán trong vòng 24 giờ để giữ phòng.
        </div>
        <div class="buttons">
            <a href="${process.env.CLIENT_URL}/my-bookings" class="btn btn-green">Thanh toán ngay →</a>
            <a href="${process.env.CLIENT_URL}/rooms" class="btn btn-secondary">Xem thêm phòng</a>
        </div>`;

    return {
        subject: `Xác nhận đặt phòng — ${hotelName}`,
        html: baseLayout({
            statusBadge: '<div class="status-badge status-pending">Chờ thanh toán</div>',
            title: 'Đặt phòng đã được tạo',
            subtitle: 'Vui lòng hoàn tất thanh toán để xác nhận',
            content
        }),
        text: `Xin chào ${user.username},\n\nĐặt phòng của bạn đã được tạo!\n\nThông tin đặt phòng:\n${bookingInfoText(booking, hotelName, roomType, checkInDate, checkOutDate, nights)}\n\n⚠️ Vui lòng hoàn tất thanh toán trong 24 giờ để xác nhận.\n\nThanh toán: ${process.env.CLIENT_URL}/my-bookings\n\nTrân trọng,\nQuickStay Team`,
    };
};

// ─── Booking Cancelled Email ───
// ─── Welcome Subscriber Email ───
export const welcomeSubscriberEmail = (email) => {
    const content = `
        <p class="greeting">
            Xin chào,<br><br>
            Cảm ơn bạn đã đăng ký nhận ưu đãi từ <strong>QuickStay</strong>!
            Bạn sẽ là người đầu tiên biết về những deal hấp dẫn nhất.
        </p>
        <div class="card">
            <div class="card-header">
                <p class="card-title">Bạn sẽ nhận được</p>
            </div>
            <div class="card-body">
                <table>
                    <tr><td class="label">🔥 Flash Sale</td><td class="value">Deal giới hạn mỗi thứ 6</td></tr>
                    <tr><td class="label">🏨 Gợi ý</td><td class="value">Khách sạn phù hợp phong cách</td></tr>
                    <tr><td class="label">✈️ Cảm hứng</td><td class="value">Điểm đến mới theo mùa</td></tr>
                    <tr><td class="label">🎁 Ưu đãi</td><td class="value">Giảm đến 15% đặt phòng</td></tr>
                </table>
            </div>
        </div>
        <div class="note">
            Ưu đãi đầu tiên sẽ được gửi đến email <strong>${email}</strong> trong vài ngày tới.
            Hãy thêm chúng tôi vào danh sách liên hệ để không bỏ lỡ!
        </div>
        <div class="buttons">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" class="btn btn-primary">Khám phá khách sạn →</a>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/rooms" class="btn btn-secondary">Xem phòng</a>
        </div>`;

    return {
        subject: 'Chào mừng bạn đến với QuickStay! 🎉',
        html: baseLayout({
            statusBadge: '<div class="status-badge status-success">Đăng ký thành công</div>',
            title: 'Chào mừng đến QuickStay',
            subtitle: 'Bạn đã sẵn sàng nhận ưu đãi độc quyền',
            content,
        }),
        text: `Xin chào,\n\nCảm ơn bạn đã đăng ký nhận ưu đãi từ QuickStay!\n\nBạn sẽ nhận được:\n- Flash Sale mỗi thứ 6\n- Gợi ý khách sạn phù hợp\n- Điểm đến mới theo mùa\n- Giảm đến 15% đặt phòng\n\nƯu đãi đầu tiên sẽ được gửi đến ${email} trong vài ngày tới.\n\nTrân trọng,\nQuickStay Team`,
    };
};

// ─── Check-in Reminder Email (gửi 24h trước) ───
export const checkInReminderEmail = (booking, user) => {
    const { checkInDate, checkOutDate, hotelName, roomType, nights } = extractBookingData(booking);

    const specialRequestSection = booking.specialRequests ? `
        <div class="note note-warn">
            <strong>📋 Yêu cầu đặc biệt của bạn:</strong><br>
            ${booking.specialRequests}
        </div>` : '';

    const paymentNote = booking.paymentMethod === 'payAtHotel'
        ? `<div class="note note-warn"><strong>💳 Lưu ý thanh toán:</strong> Bạn chọn thanh toán tại khách sạn. Vui lòng chuẩn bị <strong>${booking.totalPrice.toLocaleString('vi-VN')} ₫</strong> khi check-in.</div>`
        : `<div class="note note-refund"><strong>✅ Đã thanh toán:</strong> Đặt phòng của bạn đã được thanh toán đầy đủ qua Stripe.</div>`;

    const content = `
        <p class="greeting">
            Xin chào <strong>${user.username}</strong>,<br><br>
            Nhắc nhở thân thiện: Bạn sẽ check-in tại <strong>${hotelName}</strong> vào <strong>ngày mai</strong> (${checkInDate}). Hãy chuẩn bị sẵn sàng!
        </p>
        ${bookingInfoTable(booking, hotelName, roomType, checkInDate, checkOutDate, nights)}
        ${paymentNote}
        ${specialRequestSection}
        <div class="note">
            <strong>📌 Cần mang theo khi check-in:</strong><br>
            • CMND / CCCD / Hộ chiếu còn hiệu lực<br>
            • Mã đặt phòng: <strong>#${booking._id.toString().slice(-8).toUpperCase()}</strong>
        </div>
        <div class="buttons">
            <a href="${process.env.CLIENT_URL}/my-bookings" class="btn btn-primary">Xem đặt phòng →</a>
        </div>`;

    return {
        subject: `⏰ Nhắc nhở check-in ngày mai — ${hotelName}`,
        html: baseLayout({
            statusBadge: '<div class="status-badge status-pending">Check-in ngày mai</div>',
            title: 'Nhắc nhở check-in',
            subtitle: `${hotelName} — ${checkInDate}`,
            content
        }),
        text: `Xin chào ${user.username},\n\nBạn sẽ check-in tại ${hotelName} vào ngày mai (${checkInDate}).\n\nThông tin:\n${bookingInfoText(booking, hotelName, roomType, checkInDate, checkOutDate, nights)}\n\nCần mang theo: CMND/CCCD/Hộ chiếu và mã đặt phòng #${booking._id.toString().slice(-8).toUpperCase()}\n\n${booking.specialRequests ? `Yêu cầu đặc biệt của bạn: ${booking.specialRequests}\n\n` : ''}Trân trọng,\nQuickStay Team`,
    };
};

// ─── Thank-you Email sau Check-out ───
export const checkOutThankYouEmail = (booking, user) => {
    const { checkInDate, checkOutDate, hotelName, roomType, nights } = extractBookingData(booking);

    const content = `
        <p class="greeting">
            Xin chào <strong>${user.username}</strong>,<br><br>
            Cảm ơn bạn đã lựa chọn <strong>${hotelName}</strong>! Chúng tôi hy vọng chuyến lưu trú ${nights} đêm vừa qua mang lại trải nghiệm tuyệt vời cho bạn.
        </p>
        <div class="card">
            <div class="card-header">
                <p class="card-title">Tóm tắt chuyến lưu trú</p>
            </div>
            <div class="card-body">
                <table>
                    <tr><td class="label">Khách sạn</td><td class="value">${hotelName}</td></tr>
                    <tr><td class="label">Loại phòng</td><td class="value">${roomType}</td></tr>
                    <tr><td class="label">Check-in</td><td class="value">${checkInDate}</td></tr>
                    <tr><td class="label">Check-out</td><td class="value">${checkOutDate}</td></tr>
                    <tr><td class="label">Số đêm lưu trú</td><td class="value">${nights} đêm</td></tr>
                    <tr class="total-row"><td class="total-label">Tổng chi tiêu</td><td class="total-value">${booking.totalPrice.toLocaleString('vi-VN')} ₫</td></tr>
                </table>
            </div>
        </div>
        <div class="note" style="text-align: center;">
            <strong>⭐ Chia sẻ trải nghiệm của bạn</strong><br>
            Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ và giúp những khách hàng khác đưa ra quyết định tốt hơn.
        </div>
        <div class="buttons">
            <a href="${process.env.CLIENT_URL}/my-bookings" class="btn btn-primary">Viết đánh giá →</a>
            <a href="${process.env.CLIENT_URL}/rooms" class="btn btn-secondary">Đặt phòng tiếp</a>
        </div>`;

    return {
        subject: `Cảm ơn bạn đã lưu trú tại ${hotelName} ✨`,
        html: baseLayout({
            statusBadge: '<div class="status-badge status-success">Hoàn thành</div>',
            title: 'Cảm ơn và hẹn gặp lại',
            subtitle: `Chúc bạn có hành trình tuyệt vời tiếp theo`,
            content
        }),
        text: `Xin chào ${user.username},\n\nCảm ơn bạn đã lựa chọn ${hotelName}!\n\nTóm tắt lưu trú:\n- Phòng: ${roomType}\n- Check-in: ${checkInDate}\n- Check-out: ${checkOutDate}\n- Số đêm: ${nights}\n- Tổng: ${booking.totalPrice.toLocaleString('vi-VN')} ₫\n\nHãy để lại đánh giá của bạn tại: ${process.env.CLIENT_URL}/my-bookings\n\nHẹn gặp lại!\nQuickStay Team`,
    };
};

// ─── Booking Cancelled Email ───
export const bookingCancelledEmail = (booking, user) => {
    const { checkInDate, checkOutDate, hotelName, roomType } = extractBookingData(booking);

    const refundSection = booking.isRefunded ? `
        <div class="note note-refund">
            <strong>Thông tin hoàn tiền:</strong><br>
            Số tiền <strong>${booking.refundAmount.toLocaleString('vi-VN')} ₫</strong> sẽ được hoàn lại vào tài khoản của bạn trong vòng 5-7 ngày làm việc.
        </div>` : '';

    const content = `
        <p class="greeting">
            Xin chào <strong>${user.username}</strong>,<br><br>
            Đặt phòng của bạn tại <strong>${hotelName}</strong> đã bị hủy.
        </p>
        <div class="card">
            <div class="card-header">
                <p class="card-title">Thông tin đặt phòng đã hủy</p>
            </div>
            <div class="card-body">
                <table>
                    <tr><td class="label">Mã đặt phòng</td><td class="value">#${booking._id.toString().slice(-8).toUpperCase()}</td></tr>
                    <tr><td class="label">Khách sạn</td><td class="value">${hotelName}</td></tr>
                    <tr><td class="label">Loại phòng</td><td class="value">${roomType}</td></tr>
                    <tr><td class="label">Check-in</td><td class="value">${checkInDate}</td></tr>
                    <tr><td class="label">Check-out</td><td class="value">${checkOutDate}</td></tr>
                    <tr><td class="label">Trạng thái</td><td class="value" style="color: #dc2626; font-weight: 600;">Đã hủy</td></tr>
                </table>
            </div>
        </div>
        ${refundSection}
        <div class="buttons">
            <a href="${process.env.CLIENT_URL}/rooms" class="btn btn-primary">Tìm phòng khác →</a>
        </div>`;

    return {
        subject: `Đặt phòng đã hủy — ${hotelName}`,
        html: baseLayout({
            statusBadge: '<div class="status-badge status-cancelled">Đã hủy</div>',
            title: 'Đặt phòng đã bị hủy',
            subtitle: 'Thông tin về đơn đặt phòng của bạn',
            content
        }),
        text: `Xin chào ${user.username},\n\nĐặt phòng của bạn tại ${hotelName} đã bị hủy.\n\nThông tin:\n- Mã đặt phòng: #${booking._id.toString().slice(-8).toUpperCase()}\n- Khách sạn: ${hotelName}\n- Check-in: ${checkInDate}\n- Check-out: ${checkOutDate}\n\n${booking.isRefunded ? `Số tiền ${booking.refundAmount.toLocaleString('vi-VN')} ₫ sẽ được hoàn lại trong 5-7 ngày.` : ''}\n\nTìm phòng khác: ${process.env.CLIENT_URL}/rooms\n\nTrân trọng,\nQuickStay Team`,
    };
};

/**
 * Email thông báo hoàn tiền đã được duyệt — gửi cho guest
 * Khác bookingCancelledEmail: tập trung vào thông tin hoàn tiền,
 * tránh gửi lại email "đã hủy" khiến khách confuse
 */
export const refundApprovedEmail = (booking, user) => {
    const { checkInDate, checkOutDate, hotelName, roomType } = extractBookingData(booking);
    const refundAmt = (booking.refundAmount || 0).toLocaleString('vi-VN');
    const refundTypeLabel = booking.refundType === 'full' ? 'Toàn bộ' : 'Một phần';

    const content = `
        <p class="greeting">
            Xin chào <strong>${user.username}</strong>,<br><br>
            Yêu cầu hoàn tiền cho đặt phòng tại <strong>${hotelName}</strong> đã được chủ khách sạn duyệt.
        </p>
        <div class="card">
            <div class="card-header">
                <p class="card-title">Thông tin hoàn tiền</p>
            </div>
            <div class="card-body">
                <table>
                    <tr><td class="label">Mã đặt phòng</td><td class="value">#${booking._id.toString().slice(-8).toUpperCase()}</td></tr>
                    <tr><td class="label">Khách sạn</td><td class="value">${hotelName}</td></tr>
                    <tr><td class="label">Loại phòng</td><td class="value">${roomType}</td></tr>
                    <tr><td class="label">Check-in</td><td class="value">${checkInDate}</td></tr>
                    <tr><td class="label">Check-out</td><td class="value">${checkOutDate}</td></tr>
                    <tr><td class="label">Số tiền hoàn</td><td class="value" style="color: #16a34a; font-weight: 600;">${refundAmt} ₫ (${refundTypeLabel})</td></tr>
                </table>
            </div>
        </div>
        <div class="note note-refund">
            <strong>Lưu ý:</strong><br>
            Số tiền <strong>${refundAmt} ₫</strong> sẽ được hoàn lại vào tài khoản Stripe/thẻ của bạn trong vòng 5-10 ngày làm việc.
        </div>
        <div class="buttons">
            <a href="${process.env.CLIENT_URL}/my-bookings" class="btn btn-primary">Xem đặt phòng →</a>
        </div>`;

    return {
        subject: `Hoàn tiền ${refundAmt} ₫ đã được duyệt — ${hotelName}`,
        html: baseLayout({
            statusBadge: '<div class="status-badge" style="background-color: #16a34a; color: #fff;">Hoàn tiền</div>',
            title: 'Hoàn tiền thành công',
            subtitle: 'Yêu cầu hoàn tiền đã được chủ khách sạn duyệt',
            content
        }),
        text: `Xin chào ${user.username},\n\nYêu cầu hoàn tiền đã được duyệt!\n\n- Mã: #${booking._id.toString().slice(-8).toUpperCase()}\n- Khách sạn: ${hotelName}\n- Phòng: ${roomType}\n- Check-in: ${checkInDate}\n- Check-out: ${checkOutDate}\n- Số tiền hoàn: ${refundAmt} ₫ (${refundTypeLabel})\n\nTiền sẽ được hoàn trong 5-10 ngày.\n\nTrân trọng,\nQuickStay Team`,
    };
};
