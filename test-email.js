require('dotenv').config();
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('--- Email Configuration Test ---');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Missing');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Missing');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ Missing EMAIL_USER or EMAIL_PASS in .env file');
        return;
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: '2300033051@kluniversity.in', // Test specific outlook address
        subject: 'Test Email from KLU Esports',
        text: 'If you receive this, your email configuration is working correctly!'
    };

    try {
        console.log('Attempting to send test email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (error) {
        console.error('❌ Failed to send email.');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);

        if (error.code === 'EAUTH') {
            console.log('\n💡 Tip: For Gmail, you MUST use an "App Password", not your regular password.');
            console.log('1. Go to https://myaccount.google.com/security');
            console.log('2. Enable 2-Step Verification.');
            console.log('3. Search for "App Passwords" and create one.');
            console.log('4. Use that 16-character code in your .env file as EMAIL_PASS.');
        }
    }
};

testEmail();
