import nodemailer from 'nodemailer';

let transporter;
let emailMode = 'none'; // 'resend' | 'smtp' | 'none'

const createTransporter = () => {
    // Ưu tiên Resend API (Railway block SMTP ports)
    if (process.env.RESEND_API_KEY) {
        emailMode = 'resend';
        console.log('✅ Email service initialized (Resend API)');
        return null; // Không cần nodemailer transporter
    }

    // Fallback: SMTP (local dev)
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        emailMode = 'smtp';
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    console.log('⚠️  Email service not configured. Emails will not be sent.');
    return null;
};

const initEmailService = () => {
    transporter = createTransporter();
    if (emailMode === 'smtp' && transporter) {
        console.log('✅ Email service initialized (SMTP)');
    }
};

/**
 * Gửi email qua Resend HTTP API (bypass SMTP port blocking)
 */
const sendViaResend = async ({ to, subject, html, text }) => {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: `${process.env.EMAIL_FROM_NAME || 'QuickStay Hotel'} <onboarding@resend.dev>`,
            to: [to],
            subject,
            html,
            text,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Resend API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
};

/**
 * Gửi email qua SMTP (nodemailer)
 */
const sendViaSMTP = async ({ to, subject, html, text }) => {
    const info = await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'QuickStay Hotel'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
    });
    return { success: true, messageId: info.messageId };
};

const sendEmail = async ({ to, subject, html, text }) => {
    console.log('📧 Attempting to send email...');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   Mode:', emailMode);

    if (emailMode === 'none') {
        console.log('⚠️  Email service not configured. Skipping email:', subject);
        return { success: false, message: 'Email service not configured' };
    }

    try {
        let result;
        if (emailMode === 'resend') {
            result = await sendViaResend({ to, subject, html, text });
        } else {
            result = await sendViaSMTP({ to, subject, html, text });
        }

        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', result.messageId);
        return result;
    } catch (error) {
        console.error('❌ Email sending failed!');
        console.error('   Error:', error.message);
        return { success: false, error: error.message };
    }
};

export { initEmailService, sendEmail };

