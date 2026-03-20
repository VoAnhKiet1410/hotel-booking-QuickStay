import { useState } from 'react';
import { 
    PaymentSuccessEmail, 
    BookingConfirmationEmail, 
    BookingCancelledEmail 
} from '../../components/EmailTemplates';

const EmailPreview = () => {
    const [selectedTemplate, setSelectedTemplate] = useState('payment-success');

    // Mock data for preview
    const mockBooking = {
        _id: '678abc123def456789012345',
        hotel: { name: 'Grand Luxury Hotel' },
        room: { roomType: 'Deluxe Suite' },
        guests: 2,
        checkInDate: new Date('2026-02-15'),
        checkOutDate: new Date('2026-02-18'),
        totalPrice: 4500000,
        isRefunded: true,
        refundAmount: 4500000,
    };

    const mockUser = {
        username: 'Nguyễn Văn An',
        email: 'nguyenvanan@example.com',
    };

    const templates = [
        { id: 'booking-confirmation', name: '📋 Booking Confirmation (Xác nhận đặt phòng)', component: BookingConfirmationEmail },
        { id: 'payment-success', name: '✅ Payment Success (Thanh toán thành công)', component: PaymentSuccessEmail },
        { id: 'booking-cancelled', name: '❌ Booking Cancelled (Hủy đặt phòng)', component: BookingCancelledEmail },
    ];

    const currentTemplate = templates.find(t => t.id === selectedTemplate);
    const TemplateComponent = currentTemplate?.component;

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: '#f0f2f5',
            padding: '40px 20px'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ 
                    background: 'white', 
                    borderRadius: '8px', 
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h1 style={{ 
                        margin: '0 0 16px 0',
                        fontSize: '28px',
                        color: '#1a202c'
                    }}>
                        📧 Email Template Preview
                    </h1>
                    <p style={{ 
                        margin: 0,
                        color: '#718096',
                        fontSize: '15px'
                    }}>
                        Preview và design các email templates cho ứng dụng booking
                    </p>
                </div>

                {/* Template Selector */}
                <div style={{ 
                    background: 'white', 
                    borderRadius: '8px', 
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 600,
                        color: '#2d3748'
                    }}>
                        Chọn Template:
                    </label>
                    <select 
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        style={{
                            padding: '12px 16px',
                            fontSize: '15px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            cursor: 'pointer',
                            minWidth: '300px'
                        }}
                    >
                        {templates.map(template => (
                            <option key={template.id} value={template.id}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Preview Area */}
                <div style={{ 
                    background: 'white', 
                    borderRadius: '8px', 
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{
                        margin: '0 0 24px 0',
                        fontSize: '20px',
                        color: '#2d3748',
                        borderBottom: '2px solid #e2e8f0',
                        paddingBottom: '12px'
                    }}>
                        Preview
                    </h2>
                    
                    {TemplateComponent && (
                        <TemplateComponent 
                            booking={mockBooking}
                            user={mockUser}
                        />
                    )}
                </div>

                {/* Info Box */}
                <div style={{
                    background: '#edf2f7',
                    borderRadius: '8px',
                    padding: '20px',
                    marginTop: '24px',
                    fontSize: '14px',
                    color: '#4a5568'
                }}>
                    <strong>💡 Lưu ý:</strong> Đây là preview trong React. Template thật được sử dụng ở backend 
                    (server/utils/emailTemplates.js) để gửi email qua nodemailer.
                </div>
            </div>
        </div>
    );
};

export default EmailPreview;
