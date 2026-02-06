const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    event_date: {
        type: Date,
        required: true
    },
    end_time: {
        type: Date
    },
    location: {
        type: String,
        required: true
    },
    game: {
        type: String,
        enum: ['Free Fire', 'BGMI', 'Valorant', 'Call Of Duty', 'All'],
        default: 'All'
    },
    max_participants: {
        type: Number
    },
    image_url: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
