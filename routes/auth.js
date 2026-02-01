const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const { isSuperAdmin } = require('../config/superAdmins');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// POST /api/auth/otp/send
router.post('/otp/send', async (req, res) => {
    try {
        const { identifier, purpose, password } = req.body;

        if (!identifier || !purpose) {
            return res.status(400).json({ success: false, message: 'Identifier and purpose are required' });
        }

        // Validate Password for Login BEFORE Sending OTP
        if (purpose === 'login') {
            const user = await User.findOne({ email: identifier });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found. Please sign up.' });
            }

            if (!password) {
                return res.status(400).json({ success: false, message: 'Password is required for login' });
            }

            // Check if password match
            // Support both hashed (new) and plain text (legacy) passwords for migration
            const isMatch = await bcrypt.compare(password, user.password || "");
            const isPlainMatch = user.password === password; // For legacy unhashed passwords

            if (!isMatch && !isPlainMatch) {
                return res.status(401).json({ success: false, message: 'Incorrect password' });
            }

            // If user has plain text password and matched, optionally upgrade to hash
            if (isPlainMatch && !isMatch) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(password, salt);
                await user.save();
            }
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

        // Find or Create User (if signup)
        let user = await User.findOne({ email: identifier });

        if (purpose === 'login') {
            // User exists (verified above), update OTP
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
        } else if (purpose === 'signup') {
            if (!user) {
                user = new User({ email: identifier });
            }
            // For signup, we just save OTP to the record (new or existing incomplete)
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
        }

        // Send Email if identifier is an email address
        if (identifier.includes('@')) {
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KLU Esports OTP</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:Verdana,Arial,sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#09090b;">
    <tr>
      <td align="center" style="padding:40px 10px;">

        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#121212;border:2px solid #dc2626;border-radius:12px;overflow:hidden;box-shadow:0 0 30px rgba(220,38,38,0.4);">
          
          <!-- HEADER -->
          <tr>
            <td align="center" style="padding:30px;border-bottom:2px solid #dc2626;">
              <img src="https://res.cloudinary.com/dus3luhur/image/upload/v1769972273/KLU-Esports-2_ea6avf.png" width="80" height="80" alt="KLU Esports" style="display:block;border-radius:50%;border:2px solid #dc2626;margin-bottom:15px;">
              <h1 style="margin:0;font-size:24px;letter-spacing:1px;color:#ffffff;">
                KLU <span style="color:#dc2626;">ESPORTS</span>
              </h1>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td align="center" style="padding:40px 25px;">
              
             <p style="color: #ffffff; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Use the One-Time Password (OTP) below to complete your ${purpose === 'login' ? 'login' : 'signup'} verification.
            </p>

              <!-- OTP BOX -->
              <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 30px auto;">
                <tr>
                  <td align="center" style="background: linear-gradient(145deg, #1a1a1a, #0a0a0a); border:2px solid #dc2626;border-radius:8px;padding:18px 30px;">
                    <span style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 0 0 20px rgba(220, 38, 38, 0.3); display: block;">${otp}</span>
                  </td>
                </tr>
              </table>

              <p style="color:#ffffff;font-size:14px;margin:0 0 5px 0;">
                Do not share this code with anyone.
              </p>
              <p style="color:#a1a1aa;font-size:13px;margin:0;">
                This code expires in <strong>5 minutes</strong>.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:24px;background:#0f0f0f;border-top:2px solid #dc2626;">
              <div style="margin-bottom:10px;">
                <a href="https://www.instagram.com/klu__esports/" style="margin:0 10px;color:#dc2626;font-size:12px;text-decoration:none;">
                  <img src="https://cdn-icons-png.flaticon.com/24/174/174855.png" width="16" height="16" style="vertical-align:middle;margin-right:4px;">Instagram
                </a>
                <a href="https://discord.com/invite/pp9wnEjbt" style="margin:0 10px;color:#dc2626;font-size:12px;text-decoration:none;">
                  <img src="https://cdn-icons-png.flaticon.com/24/5968/5968756.png" width="16" height="16" style="vertical-align:middle;margin-right:4px;">Discord
                </a>
                <a href="https://www.youtube.com/@esports.kluniversity" style="margin:0 10px;color:#dc2626;font-size:12px;text-decoration:none;">
                  <img src="https://cdn-icons-png.flaticon.com/24/1384/1384060.png" width="16" height="16" style="vertical-align:middle;margin-right:4px;">YouTube
                </a>
              </div>

              <p style="color:#71717a;font-size:12px;margin:20px 0 0 0;">
                © 2026 KLU Esports Club. All rights reserved.
              </p>
              <p style="color:#71717a;font-size:11px;margin:8px 0 0 0;">
                Designed and Developed by <span style="color:#dc2626;">S. Veerendra Chowdary</span>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>

`;

            const mailOptions = {
                from: `"KLU Esports" <${process.env.EMAIL_USER}>`,
                to: identifier,
                subject: `KLU Esports - ${purpose === 'login' ? 'Login' : 'Signup'} OTP`,
                text: `Your OTP for KLU Esports is: ${otp}. It expires in 5 minutes.`, // Fallback for plain text clients
                html: htmlContent
            };

            await transporter.sendMail(mailOptions);
        }

        res.status(200).json({
            success: true,
            message: `OTP sent to ${identifier}`
        });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Server error sending OTP' });
    }
});

// POST /api/auth/otp/verify
router.post('/otp/verify', async (req, res) => {
    try {
        const { identifier, otp, purpose, userData } = req.body;

        if (!identifier || !otp || !purpose) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Find User
        const user = await User.findOne({ email: identifier });

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        // Verify OTP
        if (!user.otp || user.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Check expiry
        if (new Date() > user.otpExpires) {
            // Clear expired OTP
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save();
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }

        // OTP Verified. Handle Signup Data Update if needed.
        if (purpose === 'signup' && userData) {
            // Fallback for username
            const finalUsername = userData.username || userData.inGameName || identifier.split('@')[0];

            user.username = finalUsername;
            user.name = userData.name;
            user.inGameName = userData.inGameName;
            user.collegeId = userData.collegeId;
            user.gameYouPlay = userData.gameYouPlay;
            user.mobile = userData.mobile;

            if (userData.password) {
                // Hash Password before saving
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(userData.password, salt);
            }

            // Determine Role based on email - Check super admin list first
            let role = 'user';
            if (isSuperAdmin(identifier)) {
                role = 'super_admin';
            } else if (identifier.toLowerCase().includes("freefire")) {
                role = "admin_freefire";
            } else if (identifier.toLowerCase().includes("bgmi")) {
                role = "admin_bgmi";
            } else if (identifier.toLowerCase().includes("valorant")) {
                role = "admin_valorant";
            } else if (identifier.toLowerCase().includes("callofduty")) {
                role = "admin_call_of_duty";
            }

            if (role !== 'user') user.role = role;
            if (role.startsWith('admin_')) {
                const gameMap = {
                    'admin_freefire': 'Free Fire',
                    'admin_bgmi': 'BGMI',
                    'admin_valorant': 'Valorant',
                    'admin_call_of_duty': 'Call Of Duty'
                };
                user.game = gameMap[role];
            }
        }

        // Clear OTP after successful verification
        user.otp = undefined;
        user.otpExpires = undefined;
        
        // Update last login time
        user.lastLogin = new Date();
        
        await user.save();

        // Generate Token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Authentication successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                role: user.role,
                game: user.game,
                name: user.name,
                inGameName: user.inGameName,
                collegeId: user.collegeId,
                mobile: user.mobile,
                gameYouPlay: user.gameYouPlay,
                bio: user.bio
            }
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ success: false, message: 'Server error verifying OTP' });
    }
});

module.exports = router;
