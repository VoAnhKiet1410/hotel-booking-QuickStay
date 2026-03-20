import nodemailer from 'nodemailer';

let transporter;

const createTransporter = () => {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️  Email service not configured. Emails will not be sent.');
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

const initEmailService = () => {
    transporter = createTransporter();
    if (transporter) {
        console.log('✅ Email service initialized');
    }
};

const sendEmail = async ({ to, subject, html, text }) => {
    console.log('📧 Attempting to send email...');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    
    if (!transporter) {
        console.log('⚠️  Email service not configured. Skipping email:', subject);
        return { success: false, message: 'Email service not configured' };
    }

    try {
        console.log('   Sending via SMTP...');
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'QuickStay Hotel'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('✅ Email sent successfully!');
        console.log('   Message ID:', info.messageId);
        console.log('   Accepted:', info.accepted);
        console.log('   Response:', info.response);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed!');
        console.error('   Error:', error.message);
        console.error('   Stack:', error.stack);
        return { success: false, error: error.message };
    }
};

export { initEmailService, sendEmail };
