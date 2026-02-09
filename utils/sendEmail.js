const axios = require('axios');

const sendEmail = async (to, subject, htmlContent, textContent = '') => {
    try {
        const response = await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: { name: 'KLU ESPORTS', email: process.env.SENDER_EMAIL },
                to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
                subject: subject,
                htmlContent: htmlContent,
                textContent: textContent || undefined
            },
            {
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                }
            }
        );
        // Only log in production to keep development console clean
        if (process.env.NODE_ENV === 'production') {
            console.log('Email sent successfully:', response.data);
        }
        return response.data;
    } catch (error) {
        console.error('Error sending email:', error.response ? error.response.data : error.message);
        // Don't throw error to prevent crashing if email fails, or maybe we should?
        // In auth flow, if email fails, user can't login/signup. So we should probably throw or handle gracefully.
        throw new Error('Email sending failed');
    }
};

module.exports = sendEmail;
