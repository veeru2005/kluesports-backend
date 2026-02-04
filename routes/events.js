const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');

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
        const { title, description, event_date, location, game, max_participants, image_url } = req.body;

        const event = new Event({
            title,
            description,
            event_date,
            location,
            game,
            max_participants,
            image_url
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
            event.title = req.body.title || event.title;
            event.description = req.body.description || event.description;
            event.event_date = req.body.event_date || event.event_date;
            event.location = req.body.location || event.location;
            event.game = req.body.game || event.game;
            event.max_participants = req.body.max_participants || event.max_participants;
            event.image_url = req.body.image_url || event.image_url;

            const updatedEvent = await event.save();
            res.json(updatedEvent);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin or SuperAdmin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (event) {
            await event.deleteOne();
            res.json({ message: 'Event removed' });
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
