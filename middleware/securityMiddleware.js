const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ─── Helmet: Secure HTTP Headers ────────────────────────────────────────────
const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://cdn-icons-png.flaticon.com"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow Cloudinary images
    crossOriginResourcePolicy: { policy: "cross-origin" },
});

// ─── Rate Limiters ──────────────────────────────────────────────────────────

// Global rate limiter: 100 requests per 1 minute per IP
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 1 minute.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Auth routes rate limiter: 10 requests per 1 minute
const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 1 minute.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// OTP routes rate limiter: 5 requests per 1 minute
const otpLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again after 1 minute.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Contact/Message rate limiter: 3 requests per 1 minute
const messageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Too many messages. Please try again after 1 minute.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Registration rate limiter: Removed to allow multiple registrations from same IP

// Upload rate limiter: 10 requests per 1 minute
const uploadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many upload attempts. Please try again after 1 minute.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── NoSQL Injection Prevention (Express 5 compatible) ──────────────────────
// Custom sanitizer since express-mongo-sanitize sets req.query (read-only in Express 5)
function sanitizeValue(val) {
    if (val instanceof Object) {
        for (const key in val) {
            if (/^\$/.test(key)) {
                delete val[key];
            } else {
                sanitizeValue(val[key]);
            }
        }
    }
    return val;
}

const sanitizeMongo = (req, res, next) => {
    if (req.body) sanitizeValue(req.body);
    if (req.params) sanitizeValue(req.params);
    next();
};
// ─── Global Error Handler ───────────────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
    console.error('❌ Unhandled Error:', err.message);

    // Don't leak error details in production
    const isProduction = process.env.NODE_ENV === 'production';

    res.status(err.status || 500).json({
        success: false,
        message: isProduction ? 'Internal Server Error' : err.message,
        ...(isProduction ? {} : { stack: err.stack }),
    });
};

// ─── 404 Not Found Handler ──────────────────────────────────────────────────
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};

module.exports = {
    helmetMiddleware,
    globalLimiter,
    authLimiter,
    otpLimiter,
    messageLimiter,
    uploadLimiter,
    sanitizeMongo,

    globalErrorHandler,
    notFoundHandler,
};

