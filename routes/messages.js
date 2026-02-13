const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
// const nodemailer = require('nodemailer');
const sendEmail = require('../utils/sendEmail');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');
const recipients = require('../config/contactRecipients.json');

// Email transporter configuration
/*
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
*/

// Generate HTML email template for contact message
const generateContactEmailHTML = (name, email, subject, message) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
  <title>New Contact Message - KLU ESPORTS</title>
  <style>
    :root {
      color-scheme: only dark;
      supported-color-schemes: only dark;
    }
    @media only screen and (max-width: 600px) {
      .main-table { width: 100% !important; border-radius: 8px !important; }
      .social-link { margin: 0 2px !important; font-size: 9px !important; white-space: nowrap !important; }
      .social-icon { width: 12px !important; height: 12px !important; margin-right: 2px !important; }
      .social-footer { white-space: nowrap !important; padding: 24px 10px !important; }
    }
    /* iOS Inversion Prevention */
    .ios-white {
      color: #71717a !important;
      -webkit-text-fill-color: #71717a !important;
      opacity: 1 !important;
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#09090b !important;font-family:Verdana,Arial,sans-serif;color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;">
  <table role="presentation" class="outer-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#09090b !important; background-image: linear-gradient(#09090b, #09090b) !important;">
    <tr>
      <td align="center" style="padding:0;background-color:#09090b !important; background-image: linear-gradient(#09090b, #09090b) !important;">
        <div style="height:20px;line-height:20px;font-size:1px;background-color:#09090b !important; background-image: linear-gradient(#09090b, #09090b) !important;">&nbsp;</div>
        <table role="presentation" class="main-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#121212 !important; background-image: linear-gradient(#121212, #121212) !important;border:2px solid #dc2626 !important;border-radius:12px;overflow:hidden;box-shadow:0 0 30px rgba(220,38,38,0.35);">
          
          <tr>
            <td align="center" style="padding:30px;border-bottom:2px solid #dc2626 !important;background-color:#121212 !important; background-image: linear-gradient(#121212, #121212) !important;">
              <img src="https://res.cloudinary.com/dus3luhur/image/upload/v1769977067/Logo1_xdqj6d.png" width="80" height="80" alt="KLU Esports" style="display:block;border-radius:50%;border:2px solid #dc2626 !important;margin-bottom:15px;">
              <h1 class="ios-white" style="margin:0;font-size:24px;letter-spacing:1px;color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;font-weight: 900 !important;">
                KLU <span style="color:#dc2626 !important;-webkit-text-fill-color: #dc2626 !important;">ESPORTS</span>
              </h1>
              <div style="margin:10px 0 0 0;font-size:14px;color:#a1a1aa !important;-webkit-text-fill-color: #a1a1aa !important;">📬 New Contact Message Received</div>
            </td>
          </tr>

          <tr>
            <td style="padding:35px 25px;background-color:#121212 !important; background-image: linear-gradient(#121212, #121212) !important;">
              <table role="presentation" class="inner-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f !important; background-image: linear-gradient(#0f0f0f, #0f0f0f) !important;border:1px solid #dc2626 !important;border-radius:8px;margin-bottom:25px;">
                <tr>
                  <td style="padding:20px;background-color:#0f0f0f !important; background-image: linear-gradient(#0f0f0f, #0f0f0f) !important;">
                    <h2 style="margin:0 0 15px 0;font-size:16px;color:#dc2626 !important;-webkit-text-fill-color: #dc2626 !important;text-transform:uppercase;border-bottom:1px solid #333;padding-bottom:8px;font-weight: 900 !important;">Sender Details</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:6px 0;color:#71717a !important;-webkit-text-fill-color: #71717a !important;font-size:14px;width:90px;">Name:</td>
                        <td class="ios-white" style="padding:6px 0;color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;font-size:14px;font-weight:900 !important;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a !important;-webkit-text-fill-color: #71717a !important;font-size:14px;">Email:</td>
                        <td style="padding:6px 0;font-size:14px;">
                          <a href="mailto:${email}" style="color:#dc2626 !important;-webkit-text-fill-color: #dc2626 !important;text-decoration:none;font-weight:bold;">${email}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a !important;-webkit-text-fill-color: #71717a !important;font-size:14px;">Subject:</td>
                        <td class="ios-white" style="padding:6px 0;color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;font-size:14px;">${subject || 'No Subject'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" class="inner-card" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f0f0f !important; background-image: linear-gradient(#0f0f0f, #0f0f0f) !important;border:1px solid #dc2626 !important;border-radius:8px;">
                <tr>
                  <td style="padding:20px;background-color:#0f0f0f !important; background-image: linear-gradient(#0f0f0f, #0f0f0f) !important;">
                    <h2 style="margin:0 0 15px 0;font-size:16px;color:#dc2626 !important;-webkit-text-fill-color: #dc2626 !important;text-transform:uppercase;border-bottom:1px solid #333;padding-bottom:8px;font-weight: 900 !important;">Message</h2>
                    <p class="ios-white" style="margin:0;font-size:15px;line-height:1.7;color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;white-space:pre-wrap;font-weight: 500 !important;">${message}</p>
                  </td>
                </tr>
              </table>

              <p class="ios-white" style="margin:24px 0 0 0;font-size:12px;color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;text-align:center;">
                This message was sent from the KLU ESPORTS website contact form.
              </p>
            </td>
          </tr>

          <tr>
            <td class="footer-cell" align="center" style="padding:24px 15px;background-color:#0f0f0f !important; background-image: linear-gradient(#0f0f0f, #0f0f0f) !important;border-top:2px solid #dc2626 !important;">
               <div style="margin-bottom: 10px;white-space:nowrap;">
                  <a href="https://www.instagram.com/klu__esports/" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626 !important; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/174/174855.png" alt="Instagram" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">Instagram
                  </a>
                  <span style="color:#71717a !important;">|</span>
                  <a href="https://discord.com/invite/pp9wnEjbt" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626 !important; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/5968/5968756.png" alt="Discord" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">Discord
                  </a>
                  <span style="color:#71717a !important;">|</span>
                  <a href="https://www.youtube.com/@esports.kluniversity" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626 !important; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/1384/1384060.png" alt="YouTube" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">YouTube
                  </a>
                  <span style="color:#71717a !important;">|</span>
                  <a href="https://www.linkedin.com/company/kl-esports-club" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626 !important; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/174/174857.png" alt="LinkedIn" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">LinkedIn
                  </a>
              </div>
              <p style="color:#71717a !important;-webkit-text-fill-color: #71717a !important;font-size:12px;margin:15px 0 0 0;padding:0 10px;line-height:1.5;">© 2026 KLU ESPORTS CLUB. All rights reserved.</p>
              <p style="color:#71717a !important;-webkit-text-fill-color: #71717a !important;font-size:10px;margin:8px 0 0 0;padding:0 10px;line-height:1.5;white-space:nowrap;">Designed and Developed by <span style="color:#dc2626 !important;-webkit-text-fill-color: #dc2626 !important;">S. Veerendra Chowdary</span></p>
            </td>
          </tr>

        </table>
        <div style="height:40px;line-height:40px;font-size:1px;background-color:#09090b !important; background-image: linear-gradient(#09090b, #09090b) !important;">&nbsp;</div>
      </td>
    </tr>
  </table>
</body>
</html>

`;
};

// Generate confirmation email HTML for the sender
const generateConfirmationEmailHTML = (name) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="only dark">
    <meta name="supported-color-schemes" content="only dark">
    <title>Message Received - KLU Esports</title>
    <style>
      :root {
        color-scheme: only dark;
        supported-color-schemes: only dark;
      }
      @media only screen and (max-width: 600px) {
        .main-table { width: 100% !important; border-radius: 8px !important; }
        .social-link { margin: 0 2px !important; font-size: 9px !important; white-space: nowrap !important; }
        .social-icon { width: 12px !important; height: 12px !important; margin-right: 2px !important; }
        .social-footer { white-space: nowrap !important; padding: 24px 10px !important; }
        .greeting-text { line-height: 1.4 !important; margin: 0 0 20px 0 !important; }
      }
      /* iOS Inversion Prevention */
      .ios-white {
        color: #71717a !important;
        -webkit-text-fill-color: #71717a !important;
        opacity: 1 !important;
      }
    </style>
</head>
<body style="margin:0;padding:0;font-family:Verdana,Arial,sans-serif;background-color:#09090b !important;color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;">
    <table role="presentation" class="outer-table" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#09090b !important; background-image: linear-gradient(#09090b, #09090b) !important;">
        <tr>
            <td align="center" style="padding:0;background-color:#09090b !important; background-image: linear-gradient(#09090b, #09090b) !important;">
                <div style="height:20px;line-height:20px;font-size:1px;background-color:#09090b !important; background-image: linear-gradient(#09090b, #09090b) !important;">&nbsp;</div>
                <table role="presentation" class="main-table" width="600" cellspacing="0" cellpadding="0" border="0" 
                    style="max-width:600px;width:100%;background-color:#121212 !important; 
                           background-image: linear-gradient(#121212, #121212) !important;
                           border: 2px solid #dc2626 !important; 
                           border-radius: 12px; 
                           overflow: hidden; 
                           box-shadow: 0 0 30px rgba(220, 38, 38, 0.35);
                           margin: 0 auto;">
                    
                    <tr>
                        <td align="center" style="padding:30px;background-color:#121212 !important; background-image: linear-gradient(#121212, #121212) !important;border-bottom:2px solid #dc2626 !important;">
                            <img src="https://res.cloudinary.com/dus3luhur/image/upload/v1769977067/Logo1_xdqj6d.png" alt="KLU Esports" style="width:80px;height:80px;border-radius:50%;border:2px solid #dc2626 !important;margin-bottom:15px;display:block;">
                            <h1 class="ios-white" style="color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;font-size:24px;font-weight:900 !important;margin:0;text-transform:uppercase;letter-spacing:1px;">KLU <span style="color:#dc2626 !important;-webkit-text-fill-color: #dc2626 !important;">Esports</span></h1>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding:40px 30px;background-color:#121212 !important; background-image: linear-gradient(#121212, #121212) !important;">
                            <div style="width:80px;height:80px;background:linear-gradient(145deg, #22c55e, #16a34a);border-radius:50%;display:inline-block;text-align:center;line-height:80px;margin-bottom:25px;box-shadow:0 0 20px rgba(34, 197, 94, 0.3);">
                                <img src="https://cdn-icons-png.flaticon.com/128/447/447147.png" alt="✓" style="width:36px;height:36px;vertical-align:middle;">
                            </div>
                            
                            <h2 class="ios-white" style="color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;font-size:22px;margin:0 0 15px 0;font-weight:900 !important;">📬 Message Received!</h2>
                            
                            <p class="ios-white" style="color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;font-size:16px;line-height:1.6;margin:0 0 25px 0;font-weight:500 !important;">
                                Hey <span style="color:#dc2626 !important;-webkit-text-fill-color: #dc2626 !important;font-weight:900 !important;">${name}</span>, Thank you for reaching out to KLU ESPORTS! We've received your message and our team will get back to you as soon as possible.
                            </p>
                            
                            <div class="inner-card" style="background-color:#0f0f0f !important; background-image: linear-gradient(#0f0f0f, #0f0f0f) !important;border:1px solid #dc2626 !important;border-radius:8px;padding:20px;margin-bottom:25px;">
                                <p style="color:#71717a !important;-webkit-text-fill-color: #71717a !important;font-size:14px;margin:0;background-color:#0f0f0f !important; background-image: linear-gradient(#0f0f0f, #0f0f0f) !important;">
                                    💡 <span class="ios-white" style="color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;">Typical response time: 24-48 hours</span>
                                </p>
                            </div>
                            
                            <div style="color:#a1a1aa !important;-webkit-text-fill-color: #a1a1aa !important;font-size:14px;margin:0;">
                                In the meantime, feel free to explore our events and join our gaming community!
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td class="footer-cell" align="center" style="padding:24px 15px;background-color:#0f0f0f !important; background-image: linear-gradient(#0f0f0f, #0f0f0f) !important;border-top:2px solid #dc2626 !important;">
               <div style="margin-bottom: 10px;white-space:nowrap;">
                  <a href="https://www.instagram.com/klu__esports/" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626 !important; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/174/174855.png" alt="Instagram" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">Instagram
                  </a>
                  <span style="color:#71717a !important;">|</span>
                  <a href="https://discord.com/invite/pp9wnEjbt" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626 !important; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/5968/5968756.png" alt="Discord" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">Discord
                  </a>
                  <span style="color:#71717a !important;">|</span>
                  <a href="https://www.youtube.com/@esports.kluniversity" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626 !important; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/1384/1384060.png" alt="YouTube" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">YouTube
                  </a>
                  <span style="color:#71717a !important;">|</span>
                  <a href="https://www.linkedin.com/company/kl-esports-club" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626 !important; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/174/174857.png" alt="LinkedIn" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">LinkedIn
                  </a>
              </div>
              <p style="color:#71717a !important;-webkit-text-fill-color: #71717a !important;font-size:12px;margin:15px 0 0 0;padding:0 10px;line-height:1.5;">© 2026 KLU ESPORTS CLUB. All rights reserved.</p>
              <p style="color:#71717a !important;-webkit-text-fill-color: #71717a !important;font-size:10px;margin:8px 0 0 0;padding:0 10px;line-height:1.5;white-space:nowrap;">Designed and Developed by <span style="color:#dc2626 !important;-webkit-text-fill-color: #dc2626 !important;">S. Veerendra Chowdary</span></p>
            </td>
                    </tr>
                </table>
                <div style="height:40px;line-height:40px;font-size:1px;background-color:#09090b !important; background-image: linear-gradient(#09090b, #09090b) !important;">&nbsp;</div>
            </td>
        </tr>
    </table>
</body>
</html>

`;
};

// @desc    Create a message and send email
// @route   POST /api/messages
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    // Save message to database
    const newMessage = new Message({
      name,
      email,
      subject,
      message
    });

    const createdMessage = await newMessage.save();

    // Send emails in background - don't let email failure block message saving
    try {
      // Use recipients from config, or fallback to single admin email
      const adminEmails = (recipients && recipients.length > 0)
        ? recipients
        : [process.env.EMAIL_USER || process.env.SENDER_EMAIL];

      await Promise.all([
        // Send notification to all admins (sendEmail handles array)
        sendEmail(
          adminEmails,
          `New Contact Message: ${subject || 'No Subject'} - from ${name}`,
          generateContactEmailHTML(name, email, subject, message)
        ),
        // Send confirmation to the person who sent the message
        sendEmail(
          email,
          'We received your message! - KLU Esports',
          generateConfirmationEmailHTML(name)
        )
      ]);
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // We don't throw here so the user still sees success since message is saved to DB
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We will get back to you soon.',
      data: createdMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
});

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private/SuperAdmin
router.delete('/:id', protect, superAdmin, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
