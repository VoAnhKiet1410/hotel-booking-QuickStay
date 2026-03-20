// Booking Cancelled Email Template - Frontend Preview Component
// Modern editorial luxury — Playfair Display, DM Sans, DM Mono

// Font stacks (consistent with backend emailTemplates.js)
const FONTS = {
    heading: "'Playfair Display', Georgia, 'Palatino Linotype', 'Book Antiqua', serif",
    body: "'DM Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    mono: "'DM Mono', Menlo, Consolas, 'Liberation Mono', monospace",
};

const BookingCancelledEmail = ({ booking, user }) => {
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('vi-VN');
    const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString('vi-VN');
    const hotelName = booking.hotel?.name || 'Hotel';
    const roomType = booking.room?.roomType || 'Room';

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
                            background: '#fef2f2',
                            color: '#991b1b',
                            border: '1px solid #fecaca',
                            marginBottom: '16px'
                        }}>
                            Đã hủy
                        </div>
                        <h1 style={{
                            fontFamily: FONTS.heading,
                            fontSize: '24px',
                            fontWeight: 600,
                            color: '#1a1a1a',
                            margin: '0 0 6px 0',
                            letterSpacing: '-0.01em'
                        }}>
                            Đặt phòng đã bị hủy
                        </h1>
                        <p style={{
                            fontSize: '13px',
                            color: '#888',
                            margin: 0,
                            fontFamily: FONTS.body,
                            fontWeight: 400
                        }}>
                            Thông tin về đơn đặt phòng của bạn
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
                            Đặt phòng của bạn tại <strong>{hotelName}</strong> đã bị hủy.
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
                                    Thông tin đặt phòng đã hủy
                                </p>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <InfoRow label="Mã đặt phòng" value={`#${booking._id.slice(-8).toUpperCase()}`} />
                                    <InfoRow label="Khách sạn" value={hotelName} />
                                    <InfoRow label="Loại phòng" value={roomType} />
                                    <InfoRow label="Check-in" value={checkInDate} />
                                    <InfoRow label="Check-out" value={checkOutDate} />
                                    <tr style={{ borderBottom: 'none' }}>
                                        <td style={{
                                            padding: '11px 20px',
                                            fontFamily: FONTS.mono,
                                            fontSize: '12px',
                                            letterSpacing: '0.04em',
                                            color: '#888',
                                            width: '40%',
                                            verticalAlign: 'top'
                                        }}>
                                            Trạng thái
                                        </td>
                                        <td style={{
                                            padding: '11px 20px',
                                            fontFamily: FONTS.body,
                                            fontSize: '14px',
                                            color: '#dc2626',
                                            fontWeight: 600,
                                            textAlign: 'right',
                                            verticalAlign: 'top'
                                        }}>
                                            Đã hủy
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Refund Info */}
                        {booking.isRefunded && (
                            <div style={{
                                border: '1px solid #e8e5e0',
                                borderLeft: '3px solid #10b981',
                                padding: '14px 18px',
                                fontSize: '14px',
                                color: '#065f46',
                                marginBottom: '24px',
                                fontFamily: FONTS.body,
                                lineHeight: 1.6,
                                background: '#ecfdf5'
                            }}>
                                <strong>Thông tin hoàn tiền:</strong><br />
                                Số tiền <strong>{booking.refundAmount?.toLocaleString('vi-VN')} ₫</strong> sẽ được hoàn lại vào tài khoản của bạn trong vòng 5-7 ngày làm việc.
                            </div>
                        )}

                        {/* Button */}
                        <div style={{ textAlign: 'center', margin: '28px 0' }}>
                            <a href="/rooms" style={{
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
                                Tìm phòng khác →
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

export default BookingCancelledEmail;
