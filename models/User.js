const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { // Real Name
        type: String,
        trim: true
    },
    username: { // Fallback or computed
        type: String,
        trim: true
    },
    inGameName: {
        type: String,
        trim: true
    },
    collegeId: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    mobile: {
        type: String,
        trim: true
    },
    password: { // Hashed ideally, storing plain text if not handling hashing yet (should hash!)
        type: String
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin_freefire', 'admin_bgmi', 'admin_valorant', 'admin_call_of_duty', 'user'],
        default: 'user'
    },
    game: { // For admin role
        type: String,
        enum: ['Free Fire', 'BGMI', 'Valorant', 'Call Of Duty']
    },
    gameYouPlay: { // For user
        type: String,
        enum: ['Free Fire', 'BGMI', 'Valorant', 'Call Of Duty']
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    lastLogin: {
        type: Date
    },
    bio: {
        type: String,
        default: "I am a Gamer"
    },
    tempEmail: { // For pending email change
        type: String,
        trim: true,
        lowercase: true
    },
    isEmailChangeAuthorized: { // Flag to track if current email has authorized the change
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
