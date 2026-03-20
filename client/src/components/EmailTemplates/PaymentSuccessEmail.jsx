// Payment Success Email Template - Frontend Preview Component
// Modern editorial luxury — Playfair Display, DM Sans, DM Mono

// Font stacks (consistent with backend emailTemplates.js)
const FONTS = {
    heading: "'Playfair Display', Georgia, 'Palatino Linotype', 'Book Antiqua', serif",
    body: "'DM Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    mono: "'DM Mono', Menlo, Consolas, 'Liberation Mono', monospace",
};

const PaymentSuccessEmail = ({ booking, user }) => {
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('vi-VN');
    const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('vi-VN');
    const hotelName = booking.hotel?.name || 'Hotel';
    const roomType = booking.room?.roomType || 'Room';
    const nights = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));

    return (
        <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

            <div style={{
                fontFamily: FONTS.body,
                lineHeight: 1.7,
                color: '#1a1a1a',
                background: '#f5f3ef',
                padding: '24px'
            }}>
                <div style={{
                    maxWidth: '560px',
                    margin: '0 auto',
                    background: '#ffffff',
                    border: '1px solid #d4d0c8',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '28px 36px',
                        textAlign: 'center',
                        borderBottom: '1px solid #e8e5e0'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            border: '2px solid #1a1a1a',
                            padding: '8px 16px',
                            fontFamily: FONTS.heading,
                            fontSize: '22px',
                            fontWeight: 700,
                            color: '#1a1a1a',
                            letterSpacing: '0.02em'
                        }}>
                            Q
                        </div>
                        <span style={{
                            display: 'block',
                            marginTop: '8px',
                            fontFamily: FONTS.mono,
                            fontSize: '11px',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: '#999'
                        }}>
                            QuickStay Hotels
                        </span>
                    </div>

                    {/* Hero */}
                    <div style={{
                        padding: '36px 36px 20px',
                        textAlign: 'center',
                        background: '#faf9f6',
                        borderBottom: '1px solid #e8e5e0'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '6px 16px',
                            fontFamily: FONTS.mono,
                            fontSize: '11px',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            background: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            marginBottom: '16px'
                        }}>
                            Đã xác nhận
                        </div>
                        <h1 style={{
                            fontFamily: FONTS.heading,
                            fontSize: '24px',
                            fontWeight: 600,
                            color: '#1a1a1a',
                            margin: '0 0 6px 0',
                            letterSpacing: '-0.01em'
                        }}>
                            Thanh toán thành công
                        </h1>
                        <p style={{
                            fontSize: '13px',
                            color: '#888',
                            margin: 0,
                            fontFamily: FONTS.body,
                            fontWeight: 400
                        }}>
                            Đặt phòng của bạn đã được xác nhận
                        </p>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '28px 36px' }}>
                        <p style={{
                            fontSize: '15px',
                            color: '#444',
                            marginBottom: '24px',
                            lineHeight: 1.7,
                            fontFamily: FONTS.body
                        }}>
                            Xin chào <strong>{user.username}</strong>,<br /><br />
                            Cảm ơn bạn đã hoàn tất thanh toán! Đặt phòng của bạn tại <strong>{hotelName}</strong> đã được xác nhận thành công.
                        </p>

                        {/* Info Card */}
                        <div style={{ border: '1px solid #e8e5e0', marginBottom: '24px' }}>
                            <div style={{
                                padding: '12px 20px',
                                borderBottom: '1px solid #e8e5e0',
                                background: '#faf9f6'
                            }}>
                                <p style={{
                                    fontFamily: FONTS.mono,
                                    fontSize: '11px',
                                    letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    color: '#999',
                                    margin: 0
                                }}>
                                    Thông tin đặt phòng
                                </p>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <InfoRow label="Mã đặt phòng" value={`#${booking._id.slice(-8).toUpperCase()}`} />
                                    <InfoRow label="Khách sạn" value={hotelName} />
                                    <InfoRow label="Loại phòng" value={roomType} />
                                    <InfoRow label="Số khách" value={`${booking.guests} người`} />
                                    <InfoRow label="Số đêm" value={`${nights} đêm`} />
                                    <InfoRow label="Check-in" value={checkInDate} />
                                    <InfoRow label="Check-out" value={checkOutDate} />
                                    <tr style={{ borderTop: '2px solid #1a1a1a', background: '#faf9f6' }}>
                                        <td style={{
                                            padding: '14px 20px',
                                            fontFamily: FONTS.mono,
                                            fontSize: '11px',
                                            letterSpacing: '0.12em',
                                            textTransform: 'uppercase',
                                            color: '#666',
                                            fontWeight: 500,
                                            verticalAlign: 'middle'
                                        }}>
                                            Tổng thanh toán
                                        </td>
                                        <td style={{
                                            padding: '14px 20px',
                                            fontFamily: FONTS.heading,
                                            fontSize: '22px',
                                            fontWeight: 700,
                                            color: '#1a1a1a',
                                            textAlign: 'right',
                                            verticalAlign: 'middle'
                                        }}>
                                            {booking.totalPrice.toLocaleString('vi-VN')} ₫
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Note */}
                        <div style={{
                            border: '1px solid #e8e5e0',
                            padding: '14px 18px',
                            fontSize: '14px',
                            color: '#666',
                            marginBottom: '24px',
                            fontFamily: FONTS.body,
                            lineHeight: 1.6,
                            background: '#faf9f6'
                        }}>
                            Vui lòng mang theo <strong>CMND/CCCD</strong> hoặc <strong>Hộ chiếu</strong> khi check-in vào ngày {checkInDate}.
                        </div>

                        {/* Buttons */}
                        <div style={{ textAlign: 'center', margin: '28px 0' }}>
                            <a href="/my-bookings" style={{
                                display: 'inline-block',
                                padding: '12px 28px',
                                background: '#1a1a1a',
                                color: '#fff',
                                textDecoration: 'none',
                                fontFamily: FONTS.body,
                                fontSize: '12px',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                border: '2px solid #1a1a1a'
                            }}>
                                Xem đặt phòng →
                            </a>
                            <a href="/rooms" style={{
                                display: 'inline-block',
                                padding: '12px 28px',
                                background: 'transparent',
                                color: '#1a1a1a',
                                textDecoration: 'none',
                                fontFamily: FONTS.body,
                                fontSize: '12px',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                border: '1px solid #1a1a1a',
                                marginLeft: '10px'
                            }}>
                                Đặt thêm phòng
                            </a>
                        </div>
                    </div>

                    {/* Contact */}
                    <div style={{
                        textAlign: 'center',
                        padding: '20px 36px',
                        borderTop: '1px solid #e8e5e0'
                    }}>
                        <p style={{
                            fontFamily: FONTS.mono,
                            fontSize: '11px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#aaa',
                            marginBottom: '6px'
                        }}>
                            Hỗ trợ khách hàng
                        </p>
                        <a href="mailto:support@quickstay.com" style={{
                            color: '#1a1a1a',
                            textDecoration: 'none',
                            fontFamily: FONTS.body,
                            fontSize: '14px',
                            fontWeight: 500
                        }}>
                            support@quickstay.com
                        </a>
                    </div>

                    {/* Footer */}
                    <div style={{
                        textAlign: 'center',
                        padding: '20px 36px',
                        borderTop: '1px solid #e8e5e0',
                        fontFamily: FONTS.mono,
                        fontSize: '11px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#bbb'
                    }}>
                        <p style={{ margin: '4px 0' }}>Trân trọng — QuickStay Team</p>
                        <p style={{ margin: '8px 0 0 0' }}>© 2026 QuickStay. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </>
    );
};

// Helper — editorial style row
const InfoRow = ({ label, value }) => (
    <tr style={{ borderBottom: '1px solid #f0eeea' }}>
        <td style={{
            padding: '11px 20px',
            fontFamily: FONTS.mono,
            fontSize: '12px',
            letterSpacing: '0.04em',
            color: '#888',
            width: '40%',
            verticalAlign: 'top'
        }}>
            {label}
        </td>
        <td style={{
            padding: '11px 20px',
            fontFamily: FONTS.body,
            fontSize: '14px',
            color: '#1a1a1a',
            fontWeight: 500,
            textAlign: 'right',
            verticalAlign: 'top'
        }}>
            {value}
        </td>
    </tr>
);

export default PaymentSuccessEmail;
