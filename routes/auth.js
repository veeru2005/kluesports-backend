const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
// const nodemailer = require('nodemailer');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const { isSuperAdmin } = require('../config/superAdmins');
const { protect } = require('../middleware/authMiddleware');

// Enhanced email template with type indicators
const getRichEmailTemplate = (title, message, otp, footerNote = "This code expires in 5 minutes.", emailType = "general") => {
  // Define type-specific styling and badges
  const typeConfig = {
    'email-change-verify': {
      badge: '📧 Email Change - Step 1',
      badgeColor: '#f97316', // Orange
      icon: '🔐',
      contextBox: `
        <div style="background:#7c2d12 !important;border-left:4px solid #f97316 !important;padding:12px 15px;margin:20px auto;max-width:90%;border-radius:6px;">
          <p style="margin:0;color:#fdba74 !important;-webkit-text-fill-color: #fdba74 !important;font-size:13px;font-weight:bold;">📋 Email Change Details:</p>
          <p style="margin:5px 0 0 0;color:#fed7aa !important;-webkit-text-fill-color: #fed7aa !important;font-size:12px;">Step 1: Verifying your current email address</p>
          <p style="margin:5px 0 0 0;color:#fef08a !important;-webkit-text-fill-color: #fef08a !important;font-size:11px;">⚠️ If you didn't request this, contact support immediately.</p>
        </div>
      `
    },
    'email-change-new': {
      badge: '✅ Email Change - Step 2',
      badgeColor: '#10b981', // Green
      icon: '✉️',
      contextBox: `
        <div style="background:#064e3b !important;border-left:4px solid #10b981 !important;padding:12px 15px;margin:20px auto;max-width:90%;border-radius:6px;">
          <p style="margin:0;color:#86efac !important;-webkit-text-fill-color: #86efac !important;font-size:13px;font-weight:bold;">✅ Step 1 Complete!</p>
          <p style="margin:5px 0 0 0;color:#d1fae5 !important;-webkit-text-fill-color: #d1fae5 !important;font-size:12px;">Now verifying your new email address</p>
          <p style="margin:5px 0 0 0;color:#fef08a !important;-webkit-text-fill-color: #fef08a !important;font-size:11px;">🔒 Final step to complete your email change</p>
        </div>
      `
    },
    'password-reset': {
      badge: '🔒 Password Reset',
      badgeColor: '#ef4444', // Red
      icon: '🔑',
      contextBox: `
        <div style="background:#7f1d1d !important;border-left:4px solid #ef4444 !important;padding:12px 15px;margin:20px auto;max-width:90%;border-radius:6px;">
          <p style="margin:0;color:#fca5a5 !important;-webkit-text-fill-color: #fca5a5 !important;font-size:13px;font-weight:bold;">🔐 Password Reset Request</p>
          <p style="margin:5px 0 0 0;color:#fecaca !important;-webkit-text-fill-color: #fecaca !important;font-size:12px;">Use this OTP to verify and set a new password</p>
          <p style="margin:5px 0 0 0;color:#fef08a !important;-webkit-text-fill-color: #fef08a !important;font-size:11px;">⚠️ If you didn't request this, secure your account now.</p>
        </div>
      `
    },
    'general': {
      badge: '🎮 KLU ESPORTS',
      badgeColor: '#dc2626',
      icon: '🔒',
      contextBox: ''
    }
  };

  const config = typeConfig[emailType] || typeConfig['general'];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
   <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
  <title>KLU ESPORTS OTP</title>
  <style>
    :root {
      color-scheme: only dark;
      supported-color-schemes: only dark;
    }
    @media only screen and (max-width: 600px) {
      .main-table { width: 100% !important; border-radius: 8px !important; }
      .header-cell { padding: 20px 15px !important; }
      .body-cell { padding: 30px 15px !important; }
      .otp-text { font-size: 28px !important; letter-spacing: 4px !important; padding: 15px 10px !important; }
      .footer-cell { padding: 20px 10px !important; }
      .social-links { display: block !important; white-space: nowrap !important; }
      .social-link { display: inline-block !important; margin: 0 2px !important; font-size: 9px !important; white-space: nowrap !important; }
      .logo-img { width: 70px !important; height: 70px !important; }
      .title-text { font-size: 22px !important; }
      .social-icon { width: 12px !important; height: 12px !important; margin-right: 2px !important; }
      .type-badge { font-size: 11px !important; padding: 6px 12px !important; }
    }
    /* Force dark mode */
    /* iOS Inversion Prevention - High Contrast Visible Grey-White */
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
      <td align="center" style="padding: 0; background-color:#09090b !important; background-image: linear-gradient(#09090b, #09090b) !important;">
        <div style="height:40px;line-height:40px;font-size:1px;background-color:#09090b !important; background-image: linear-gradient(#09090b, #09090b) !important;">&nbsp;</div>
        <table role="presentation" class="main-table" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#121212 !important; background-image: linear-gradient(#121212, #121212) !important; border:2px solid #dc2626 !important;border-radius:12px;overflow:hidden;">
          <!-- TYPE BADGE -->
          <tr>
            <td align="center" style="padding:35px 15px 15px 15px; background-color: #121212 !important; background-image: linear-gradient(#121212, #121212) !important;">
              <div class="type-badge ios-white" style="display:inline-block;background-color:${config.badgeColor} !important;color:#fefefe !important;-webkit-text-fill-color: #fefefe !important;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:bold;letter-spacing:0.5px;">
                ${config.badge}
              </div>
            </td>
          </tr>
          <!-- HEADER -->
          <tr>
            <td class="header-cell" align="center" style="padding:30px 30px 45px 30px;border-bottom:2px solid #dc2626 !important;background-color:#121212 !important; background-image: linear-gradient(#121212, #121212) !important;">
              <img class="logo-img" src="https://res.cloudinary.com/dus3luhur/image/upload/v1769977067/Logo1_xdqj6d.png" width="80" height="80" alt="KLU ESPORTS" style="display:block;border-radius:50%;border:2px solid #dc2626 !important;margin:0 auto 20px auto;">
              <h1 class="title-text" style="margin:0;font-size:24px;letter-spacing:1px;color:#d1d1d1 !important;">
                <span class="ios-white" style="color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;font-weight: 900 !important;">KLU</span> <span style="color:#dc2626 !important;-webkit-text-fill-color: #dc2626 !important;font-weight: 900 !important;">ESPORTS</span>
              </h1>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td class="body-cell" align="center" style="padding:40px 25px;background-color:#121212 !important; background-image: linear-gradient(#121212, #121212) !important;">
              <p class="ios-white" style="color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;font-size:16px;line-height:1.6;margin:0 0 20px 0;padding:0 10px;text-align:center;font-weight: 500 !important;">
                ${message}
              </p>
              ${config.contextBox}
              <!-- OTP BOX -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:30px auto 40px auto;max-width:100%;">
                <tr>
                  <td align="center" style="background-color:#000000 !important; background-image: linear-gradient(#000000, #000000) !important;border:2px solid #dc2626 !important;border-radius:8px;padding:25px 35px;">
                    <span class="otp-text ios-white" style="color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;font-size:36px;font-weight:bold;letter-spacing:8px;font-family:'Courier New',monospace;display:block;word-break:break-all;">${otp}</span>
                  </td>
                </tr>
              </table>
              <p class="ios-white" style="color:#d1d1d1 !important;-webkit-text-fill-color: #d1d1d1 !important;font-size:14px;margin:0 0 5px 0;padding:0 10px;text-align:center;">
                Do not share this code with anyone.
              </p>
              <div style="color:#a1a1aa !important;-webkit-text-fill-color: #a1a1aa !important;font-size:13px;margin:0;padding:0 10px;text-align:center;text-shadow: none !important;">
                ${footerNote}
              </div>
            </td>
          </tr>
          <!-- FOOTER -->
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
              <p style="color:#71717a !important;font-size:12px;margin:15px 0 0 0;padding:0 10px;line-height:1.5;">© 2026 KLU ESPORTS CLUB. All rights reserved.</p>
              <p style="color:#71717a !important;font-size:10px;margin:8px 0 0 0;padding:0 10px;line-height:1.5;white-space:nowrap;">Designed and Developed by <span style="color:#dc2626 !important;">S. Veerendra Chowdary</span></p>
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

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper to generate JWT with session info
const generateToken = (id) => {
  const now = new Date();
  const loginDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const loginTimestamp = now.getTime();

  // Calculate expiration: 6 hours from now OR end of day (whichever is sooner)
  const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const expirationTime = Math.min(sixHoursLater.getTime(), endOfDay.getTime());
  const expiresInSeconds = Math.floor((expirationTime - now.getTime()) / 1000);

  return jwt.sign(
    {
      id,
      loginDate,
      loginTimestamp
    },
    process.env.JWT_SECRET,
    {
      expiresIn: expiresInSeconds,
    }
  );
};

/*
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use built-in service for better reliability
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
*/

// POST /api/auth/otp/send
router.post('/otp/send', async (req, res) => {
  try {
    let { identifier, purpose, password } = req.body;

    if (!identifier || !purpose) {
      return res.status(400).json({ success: false, message: 'Identifier and purpose are required' });
    }

    // Prepare identifier (lowercase and trim for consistency)
    identifier = identifier.toLowerCase().trim();

    // Restricted to Gmail for signup
    if (purpose === 'signup' && !identifier.endsWith('@gmail.com')) {
      return res.status(400).json({ success: false, message: 'Only Gmail addresses are accepted for signup' });
    }

    // Find User
    let user = await User.findOne({ email: identifier });


    // Validate Password for Login BEFORE Sending OTP
    if (purpose === 'login') {
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found. Please sign up.' });
      }

      if (!user.isVerified) {
        return res.status(401).json({ success: false, message: 'Account not verified. Please sign up again to verify your email.' });
      }

      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required for login' });
      }

      // Check if password match
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

      // If user is a standard user, login immediately without OTP
      const isSuper = isSuperAdmin(identifier);
      if (user.role === 'user' && !isSuper) {
        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(user._id);
        return res.status(200).json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            id: user._id,
            email: user.email,
            username: user.username,
            role: user.role,
            game: user.game,
            name: user.name,
            inGameName: user.inGameName,
            inGameId: user.inGameId,
            collegeId: user.collegeId,
            mobile: user.mobile,
            gameYouPlay: user.gameYouPlay,
            bio: user.bio,
            createdAt: user.createdAt
          }
        });
      }
    }

    // Generate OTP for Admins, Super Admins, and Signup
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    if (purpose === 'login') {
      // Admin/SuperAdmin exists (verified above), update OTP
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
      const subject = `KLU ESPORTS - ${purpose === 'login' ? 'Login' : 'Signup'} OTP`;
      const htmlContent = getRichEmailTemplate(
        'KLU ESPORTS',
        `Use the One-Time Password (OTP) below to complete your ${purpose === 'login' ? 'login' : 'signup'} verification.`,
        otp
      );
      const textContent = `Your OTP for KLU ESPORTS is: ${otp}. It expires in 5 minutes.`;

      await sendEmail(identifier, subject, htmlContent, textContent);
    }

    res.status(200).json({
      success: true,
      message: `OTP sent to ${identifier}`
    });

  } catch (error) {
    console.error('OTP Send Error detail:', error);
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

      // Check for duplicate College ID
      if (userData.collegeId) {
        const existingCollegeId = await User.findOne({ collegeId: userData.collegeId });
        if (existingCollegeId && existingCollegeId._id.toString() !== user._id.toString()) {
          return res.status(400).json({ success: false, message: 'College ID already registered with another account' });
        }
      }

      // Check for duplicate In-Game ID
      if (userData.inGameId) {
        const existingInGameId = await User.findOne({ inGameId: userData.inGameId });
        if (existingInGameId && existingInGameId._id.toString() !== user._id.toString()) {
          return res.status(400).json({ success: false, message: 'In-Game ID already registered with another account' });
        }
      }

      // Fallback for username
      const finalUsername = userData.username || userData.inGameName || identifier.split('@')[0];

      user.username = finalUsername;
      user.name = userData.name;
      user.inGameName = userData.inGameName;
      user.inGameId = userData.inGameId;
      user.collegeId = userData.collegeId;
      user.gameYouPlay = userData.gameYouPlay;
      user.mobile = userData.mobile;
      if (userData.bio) user.bio = userData.bio;

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

      // Mark user as verified after signup
      user.isVerified = true;
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
        inGameId: user.inGameId,
        collegeId: user.collegeId,
        mobile: user.mobile,
        gameYouPlay: user.gameYouPlay,
        bio: user.bio,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error verifying OTP' });
  }
});

// --- New Routes for Self-Service Email/Password Updates ---

// STEP 1: Send OTP to CURRENT Email to authorize change
router.post('/otp/send-current-email-otp', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    user.isEmailChangeAuthorized = false; // Reset authorization
    user.tempEmail = undefined; // Clear any stale temp email
    await user.save();

    const subject = 'KLU ESPORTS - Authorize Email Change';
    const htmlContent = getRichEmailTemplate(
      'KLU ESPORTS',
      'You requested to change your account email. To authorize this change, please enter the OTP below.',
      otp,
      'This code expires in 5 minutes.',
      'email-change-verify'
    );

    await sendEmail(user.email, subject, htmlContent);
    res.json({ success: true, message: 'OTP sent to your current email' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// STEP 2: Verify CURRENT Email OTP
router.post('/otp/verify-current-email-otp', protect, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    user.isEmailChangeAuthorized = true; // Authorized!
    await user.save();

    res.json({ success: true, message: 'Current email verified. Please enter new email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// STEP 3: Send OTP to NEW Email (Only if authorized)
router.post('/otp/send-new-email-otp', protect, async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ success: false, message: 'New email is required' });

    const user = await User.findById(req.user._id);

    if (!user.isEmailChangeAuthorized) {
      return res.status(403).json({ success: false, message: 'You must verify your current email first.' });
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already in use' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    user.tempEmail = newEmail; // Store temp email
    await user.save();

    const subject = 'KLU ESPORTS - Verify New Email';
    const htmlContent = getRichEmailTemplate(
      'KLU ESPORTS',
      `Please verify your new email address <span style="white-space:nowrap">(<a href="mailto:${newEmail}" style="color: #10b981; text-decoration: none;">${newEmail}</a>)</span> to complete the email change process.`,
      otp,
      'This code expires in 5 minutes.',
      'email-change-new'
    );

    await sendEmail(newEmail, subject, htmlContent);
    res.json({ success: true, message: 'OTP sent to new email' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// STEP 4: Verify NEW Email OTP and Update
router.post('/otp/verify-new-email-otp', protect, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (!user.tempEmail) {
      return res.status(400).json({ success: false, message: 'No new email request found.' });
    }

    user.email = user.tempEmail; // UPDATE EMAIL
    user.otp = undefined;
    user.otpExpires = undefined;
    user.tempEmail = undefined;
    user.isEmailChangeAuthorized = false; // Reset flow
    await user.save();

    res.json({ success: true, message: 'Email updated successfully', newEmail: user.email });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/otp/send-reset-password
router.post('/otp/send-reset-password', protect, async (req, res) => {
  try {
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    const user = await User.findById(req.user._id);
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const subject = 'KLU ESPORTS - Password Change Request OTP';
    const htmlContent = getRichEmailTemplate(
      'KLU ESPORTS',
      'You requested to reset your password. Use the OTP below to verify and set your new password.',
      otp,
      'This code expires in 5 minutes.',
      'password-reset'
    );

    await sendEmail(user.email, subject, htmlContent);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/otp/verify-reset-password
router.post('/otp/verify-reset-password', protect, async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/forgot-password (Public)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const subject = 'KLU ESPORTS - Password Reset Request';
    const htmlContent = getRichEmailTemplate(
      'KLU ESPORTS',
      'You requested to reset your password. Use the OTP below to verify and set your new password.',
      otp,
      'This code expires in 5 minutes.',
      'password-reset'
    );

    await sendEmail(user.email, subject, htmlContent);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/reset-password (Public)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
