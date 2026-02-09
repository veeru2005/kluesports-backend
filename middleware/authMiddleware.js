const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Additional validation: Check if session is from today and within 6 hours
            const now = new Date();
            const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const currentTime = now.getTime();

            // Check if login date matches current date
            if (decoded.loginDate !== currentDate) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please login again.',
                    sessionExpired: true
                });
            }

            // Check if session is within 6 hours
            const timeDiff = currentTime - decoded.loginTimestamp;
            const sixHoursInMs = 6 * 60 * 60 * 1000;

            if (timeDiff > sixHoursInMs) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please login again.',
                    sessionExpired: true
                });
            }

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                    sessionExpired: true
                });
            }

            if (!req.user.isVerified) {
                return res.status(401).json({
                    success: false,
                    message: 'Account not verified. Please complete signup.',
                    sessionExpired: true
                });
            }

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Session expired. Please login again.',
                    sessionExpired: true
                });
            }
            res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

const superAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Not authorized as super admin' });
    }
};

const admin = (req, res, next) => {
    if (req.user && (req.user.role.startsWith('admin_') || req.user.role === 'super_admin')) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }
};

module.exports = { protect, superAdmin, admin };
