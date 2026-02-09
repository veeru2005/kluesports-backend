const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');

// Helper to validate game admin access
const validateGameAccess = (user, game) => {
    if (user.role === 'super_admin') return true;
    if (user.role === 'admin_freefire' && game === 'Free Fire') return true;
    if (user.role === 'admin_bgmi' && game === 'BGMI') return true;
    if (user.role === 'admin_valorant' && game === 'Valorant') return true;
    if (user.role === 'admin_call_of_duty' && game === 'Call Of Duty') return true;
    return false;
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
router.get('/', async (req, res) => {
    try {
        const events = await Event.find({});
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create an event
// @route   POST /api/events
// @access  Private/Admin or SuperAdmin
router.post('/', protect, admin, async (req, res) => {
    try {
        const { title, description, event_date, end_time, location, game, max_participants, image_url } = req.body;

        if (!validateGameAccess(req.user, game)) {
            return res.status(403).json({ message: 'Not authorized to create events for this game' });
        }

        const event = new Event({
            title,
            description,
            event_date,
            end_time,
            location,
            game,
            max_participants,
            image_url,
            is_registration_open: req.body.is_registration_open !== undefined ? req.body.is_registration_open : true
        });

        const createdEvent = await event.save();
        res.status(201).json(createdEvent);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin or SuperAdmin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (event) {
            // Validate access
            if (!validateGameAccess(req.user, event.game) || (req.body.game && !validateGameAccess(req.user, req.body.game))) {
                return res.status(403).json({ message: 'Not authorized to update events for this game' });
            }
            event.title = req.body.title || event.title;
            event.description = req.body.description || event.description;
            event.event_date = req.body.event_date || event.event_date;
            event.end_time = req.body.end_time || event.end_time;
            event.location = req.body.location || event.location;
            event.game = req.body.game || event.game;
            event.max_participants = req.body.max_participants || event.max_participants;
            event.image_url = req.body.image_url || event.image_url;
            if (req.body.is_registration_open !== undefined) {
                event.is_registration_open = req.body.is_registration_open;
            }

            const updatedEvent = await event.save();
            res.json(updatedEvent);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

const User = require('../models/User');

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/SuperAdmin
router.delete('/:id', protect, superAdmin, async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (event) {
            // Remove this event from all user profiles' registrations array
            await User.updateMany(
                { 'registrations.eventId': eventId },
                { $pull: { registrations: { eventId: eventId } } }
            );

            await event.deleteOne();
            res.json({ message: 'Event removed and cleaned from user profiles' });
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
