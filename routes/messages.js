const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
// const nodemailer = require('nodemailer');
const sendEmail = require('../utils/sendEmail');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');

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
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Contact Message - KLU ESPORTS</title>
  <style>
    @media only screen and (max-width: 600px) {
      .main-table {
        border-radius: 8px !important;
      }
      .social-link {
        margin: 0 2px !important;
        font-size: 9px !important;
        white-space: nowrap !important;
      }
      .social-icon {
        width: 12px !important;
        height: 12px !important;
        margin-right: 2px !important;
      }
      .social-footer {
        white-space: nowrap !important;
        padding: 24px 10px !important;
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:Verdana,Arial,sans-serif;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#09090b;">
    <tr>
      <td align="center" style="padding:40px 10px;">
        <table role="presentation" class="main-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#121212;border:2px solid #dc2626;border-radius:12px;overflow:hidden;box-shadow:0 0 30px rgba(220,38,38,0.35);">
          
          <tr>
            <td align="center" style="padding:30px;border-bottom:2px solid #dc2626;">
              <img src="https://res.cloudinary.com/dus3luhur/image/upload/v1769977067/Logo1_xdqj6d.png" width="80" height="80" alt="KLU Esports" style="display:block;border-radius:50%;border:2px solid #dc2626;margin-bottom:15px;">
              <h1 style="margin:0;font-size:24px;letter-spacing:1px;color:#ffffff;">
                KLU <span style="color:#dc2626;">ESPORTS</span>
              </h1>
              <p style="margin:10px 0 0 0;font-size:14px;color:#a1a1aa;">📬 New Contact Message Received</p>
            </td>
          </tr>

          <tr>
            <td style="padding:35px 25px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0f0f;border:1px solid #dc2626;border-radius:8px;margin-bottom:25px;">
                <tr>
                  <td style="padding:20px;">
                    <h2 style="margin:0 0 15px 0;font-size:16px;color:#dc2626;text-transform:uppercase;border-bottom:1px solid #333;padding-bottom:8px;">Sender Details</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:6px 0;color:#71717a;font-size:14px;width:90px;">Name:</td>
                        <td style="padding:6px 0;color:#ffffff;font-size:14px;font-weight:bold;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a;font-size:14px;">Email:</td>
                        <td style="padding:6px 0;font-size:14px;">
                          <a href="mailto:${email}" style="color:#dc2626;text-decoration:none;font-weight:bold;">${email}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a;font-size:14px;">Subject:</td>
                        <td style="padding:6px 0;color:#ffffff;font-size:14px;">${subject || 'No Subject'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0f0f0f;border:1px solid #dc2626;border-radius:8px;">
                <tr>
                  <td style="padding:20px;">
                    <h2 style="margin:0 0 15px 0;font-size:16px;color:#dc2626;text-transform:uppercase;border-bottom:1px solid #333;padding-bottom:8px;">Message</h2>
                    <p style="margin:0;font-size:15px;line-height:1.7;color:#ffffff;white-space:pre-wrap;">${message}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:12px;color:#ffffff;text-align:center;">
                This message was sent from the KLU ESPORTS website contact form.
              </p>
            </td>
          </tr>

          <tr>
            <td class="footer-cell" align="center" style="padding:24px 15px;background:#0f0f0f;border-top:2px solid #dc2626;">
               <div style="margin-bottom: 10px;white-space:nowrap;">
                  <a href="https://www.instagram.com/klu__esports/" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/174/174855.png" alt="Instagram" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">Instagram
                  </a>
                  <span style="color:#71717a;">|</span>
                  <a href="https://discord.com/invite/pp9wnEjbt" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/5968/5968756.png" alt="Discord" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">Discord
                  </a>
                  <span style="color:#71717a;">|</span>
                  <a href="https://www.youtube.com/@esports.kluniversity" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/1384/1384060.png" alt="YouTube" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">YouTube
                  </a>
                  <span style="color:#71717a;">|</span>
                  <a href="https://www.linkedin.com/company/kl-esports-club" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/174/174857.png" alt="LinkedIn" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">LinkedIn
                  </a>
              </div>
              <p style="color:#71717a;font-size:12px;margin:15px 0 0 0;padding:0 10px;line-height:1.5;">© 2026 KLU Esports Club. All rights reserved.</p>
              <p style="color:#71717a;font-size:10px;margin:8px 0 0 0;padding:0 10px;line-height:1.5;white-space:nowrap;">Designed and Developed by <span style="color:#dc2626;">S. Veerendra Chowdary</span></p>
            </td>
          </tr>

        </table>
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
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Message Received - KLU Esports</title>
    <style>
      @media only screen and (max-width: 600px) {
        .main-table {
          border-radius: 8px !important;
        }
        .social-link {
          margin: 0 2px !important;
          font-size: 9px !important;
          white-space: nowrap !important;
        }
        .social-icon {
          width: 12px !important;
          height: 12px !important;
          margin-right: 2px !important;
        }
        .social-footer {
          white-space: nowrap !important;
          padding: 24px 10px !important;
        }
        .greeting-text {
          line-height: 1.4 !important;
          margin: 0 0 20px 0 !important;
        }
      }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Verdana',Arial,sans-serif; background-color: #09090b; color: #ffffff;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" class="main-table" width="600" cellspacing="0" cellpadding="0" border="0" 
                    style="background-color: #121212; 
                           border: 2px solid #dc2626; 
                           border-radius: 12px; 
                           overflow: hidden; 
                           box-shadow: 0 0 30px rgba(220, 38, 38, 0.35);
                           margin: 0 auto;">
                    
                    <tr>
                        <td align="center" style="padding: 30px; background-color: #121212; border-bottom: 2px solid #dc2626;">
                            <img src="https://res.cloudinary.com/dus3luhur/image/upload/v1769977067/Logo1_xdqj6d.png" alt="KLU Esports" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid #dc2626; margin-bottom: 15px; display: block;">
                            <h1 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px;">KLU <span style="color: #dc2626; text-shadow: 0 0 10px rgba(220, 38, 38, 0.5);">Esports</span></h1>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding: 40px 30px;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(145deg, #22c55e, #16a34a); border-radius: 50%; display: inline-block; text-align: center; line-height: 80px; margin-bottom: 25px; box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);">
                                <img src="https://cdn-icons-png.flaticon.com/128/447/447147.png" alt="✓" style="width: 36px; height: 36px; vertical-align: middle;">
                            </div>
                            
                            <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 15px 0;">📬 Message Received!</h2>
                            
                            <p class="greeting-text" style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                Hey <span style="color: #dc2626; font-weight: bold;">${name}</span>, Thank you for reaching out to KLU ESPORTS! We've received your message and our team will get back to you as soon as possible.
                            </p>
                            
                            <div style="background: linear-gradient(145deg, #1a1a1a, #0a0a0a); border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                                <p style="color: #71717a; font-size: 14px; margin: 0;">
                                    💡 <span style="color: #ffffff;">Typical response time: 24-48 hours</span>
                                </p>
                            </div>
                            
                            <p style="color: #a1a1aa; font-size: 14px; margin: 0;">
                                In the meantime, feel free to explore our events and join our gaming community!
                            </p>
                        </td>
                    </tr>

                    <tr>
                         <td class="footer-cell" align="center" style="padding:24px 15px;background:#0f0f0f;border-top:2px solid #dc2626;">
               <div style="margin-bottom: 10px;white-space:nowrap;">
                  <a href="https://www.instagram.com/klu__esports/" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/174/174855.png" alt="Instagram" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">Instagram
                  </a>
                  <span style="color:#71717a;">|</span>
                  <a href="https://discord.com/invite/pp9wnEjbt" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/5968/5968756.png" alt="Discord" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">Discord
                  </a>
                  <span style="color:#71717a;">|</span>
                  <a href="https://www.youtube.com/@esports.kluniversity" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/1384/1384060.png" alt="YouTube" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">YouTube
                  </a>
                  <span style="color:#71717a;">|</span>
                  <a href="https://www.linkedin.com/company/kl-esports-club" class="social-link" style="margin: 0 4px; text-decoration: none; display: inline-block; color: #dc2626; font-size: 11px;white-space:nowrap;">
                      <img class="social-icon" src="https://cdn-icons-png.flaticon.com/128/174/174857.png" alt="LinkedIn" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">LinkedIn
                  </a>
              </div>
              <p style="color:#71717a;font-size:12px;margin:15px 0 0 0;padding:0 10px;line-height:1.5;">© 2026 KLU Esports Club. All rights reserved.</p>
              <p style="color:#71717a;font-size:10px;margin:8px 0 0 0;padding:0 10px;line-height:1.5;white-space:nowrap;">Designed and Developed by <span style="color:#dc2626;">S. Veerendra Chowdary</span></p>
            </td>
                    </tr>
                </table>
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

    // Send email to admin
    // Send both emails
    await Promise.all([
      sendEmail(
        process.env.EMAIL_USER,
        `New Contact Message: ${subject || 'No Subject'} - from ${name}`,
        generateContactEmailHTML(name, email, subject, message)
      ),
      sendEmail(
        email,
        'We received your message! - KLU Esports',
        generateConfirmationEmailHTML(name)
      )
    ]);

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
