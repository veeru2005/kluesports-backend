const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// ─── Security Middleware ────────────────────────────────────────────────────
const {
    helmetMiddleware,
    globalLimiter,
    authLimiter,
    otpLimiter,
    messageLimiter,
    registrationLimiter,
    uploadLimiter,
    sanitizeMongo,
    hppMiddleware,
    globalErrorHandler,
    notFoundHandler,
} = require('./middleware/securityMiddleware');

// Helmet: Security HTTP headers
app.use(helmetMiddleware);

// Hide X-Powered-By header
app.disable('x-powered-by');

// Trust proxy (required for rate limiter behind Nginx/reverse proxy)
app.set('trust proxy', 1);

// Global rate limiter
app.use(globalLimiter);

// CORS: Only allow known origins
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://kluesports.in',
        'https://www.kluesports.in',
        'https://kluesports.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Body parser with size limits (prevent large payload attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// NoSQL injection prevention
app.use(sanitizeMongo);

// HTTP Parameter Pollution protection
app.use(hppMiddleware);

// ─── Database ───────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// ─── Routes ─────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const registrationRoutes = require('./routes/registrations');
const startReminderScheduler = require('./utils/reminderScheduler');

// Apply specific rate limiters per route group
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/messages', messageLimiter, messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/registrations', registrationLimiter, registrationRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'KLU Esports API is running' });
});

// ─── Error Handling ─────────────────────────────────────────────────────────
// 404 handler for unknown routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// ─── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    startReminderScheduler();
});
