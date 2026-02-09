const mongoose = require('mongoose');

// Base player schema for common fields
const playerBaseSchema = {
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    collegeId: {
        type: String,
        required: true,
        trim: true
    },
    mobileNumber: {
        type: String,
        required: true,
        trim: true
    },
    inGameId: {
        type: String,
        required: true,
        trim: true
    }
};

// Valorant player schema with additional fields
const valorantPlayerSchema = {
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    collegeId: {
        type: String,
        required: true,
        trim: true
    },
    mobileNumber: {
        type: String,
        required: true,
        trim: true
    },
    riotId: {
        type: String,
        required: true,
        trim: true
    },
    peakRank: {
        type: String,
        required: true,
        trim: true
    },
    currentRank: {
        type: String,
        required: true,
        trim: true
    },
    level: {
        type: String,
        required: true,
        trim: true
    }
};

// Team Lead schema (same for all games)
const teamLeadSchema = {
    name: { type: String, required: true, trim: true },
    collegeId: { type: String, required: true, trim: true },
    discordId: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    inGameId: { type: String, trim: true }
};

// Team Lead schema for Valorant
const valorantTeamLeadSchema = {
    name: { type: String, required: true, trim: true },
    collegeId: { type: String, required: true, trim: true },
    discordId: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    riotId: { type: String, required: true, trim: true },
    peakRank: { type: String, required: true, trim: true },
    currentRank: { type: String, required: true, trim: true },
    level: { type: String, required: true, trim: true }
};

// FreeFire Registration Schema (4 players)
const freeFireRegistrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventTitle: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamName: { type: String, required: true, trim: true },
    teamSize: { type: Number, required: true, default: 4 },
    teamLogo: { type: String },
    teamLead: teamLeadSchema,
    player2: playerBaseSchema,
    player3: playerBaseSchema,
    player4: playerBaseSchema,
    game: { type: String, default: 'Free Fire' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

// BGMI Registration Schema (4 players)
const bgmiRegistrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventTitle: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamName: { type: String, required: true, trim: true },
    teamSize: { type: Number, required: true, default: 4 },
    teamLogo: { type: String },
    teamLead: teamLeadSchema,
    player2: playerBaseSchema,
    player3: playerBaseSchema,
    player4: playerBaseSchema,
    game: { type: String, default: 'BGMI' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

// Valorant Registration Schema (5 players)
const valorantRegistrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventTitle: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamName: { type: String, required: true, trim: true },
    teamSize: { type: Number, required: true, default: 5 },
    teamLogo: { type: String },
    teamLead: valorantTeamLeadSchema,
    player2: valorantPlayerSchema,
    player3: valorantPlayerSchema,
    player4: valorantPlayerSchema,
    player5: valorantPlayerSchema,
    game: { type: String, default: 'Valorant' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

// Call Of Duty Registration Schema (4 players)
const callOfDutyRegistrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventTitle: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamName: { type: String, required: true, trim: true },
    teamSize: { type: Number, required: true, default: 4 },
    teamLogo: { type: String },
    teamLead: teamLeadSchema,
    player2: playerBaseSchema,
    player3: playerBaseSchema,
    player4: playerBaseSchema,
    game: { type: String, default: 'Call Of Duty' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

const FreeFireRegistration = mongoose.model('FreeFireRegistration', freeFireRegistrationSchema);
const BGMIRegistration = mongoose.model('BGMIRegistration', bgmiRegistrationSchema);
const ValorantRegistration = mongoose.model('ValorantRegistration', valorantRegistrationSchema);
const CallOfDutyRegistration = mongoose.model('CallOfDutyRegistration', callOfDutyRegistrationSchema);

module.exports = {
    FreeFireRegistration,
    BGMIRegistration,
    ValorantRegistration,
    CallOfDutyRegistration
};
