const express = require('express');
const router = express.Router();
const { FreeFireRegistration, BGMIRegistration, ValorantRegistration, CallOfDutyRegistration } = require('../models/Registration');
const User = require('../models/User');
const Event = require('../models/Event');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');

// Helper to get the correct model based on game
const getModelByGame = (game) => {
    switch (game) {
        case 'Free Fire':
            return FreeFireRegistration;
        case 'BGMI':
            return BGMIRegistration;
        case 'Valorant':
            return ValorantRegistration;
        case 'Call Of Duty':
            return CallOfDutyRegistration;
        default:
            return null;
    }
};


// @desc    Get counts for ALL events across ALL games
// @route   GET /api/registrations/all-summary
// @access  Public
router.get('/all-summary', async (req, res) => {
    try {
        const [ff, bgmi, val, cod] = await Promise.all([
            FreeFireRegistration.aggregate([{ $group: { _id: '$eventId', count: { $sum: 1 } } }]),
            BGMIRegistration.aggregate([{ $group: { _id: '$eventId', count: { $sum: 1 } } }]),
            ValorantRegistration.aggregate([{ $group: { _id: '$eventId', count: { $sum: 1 } } }]),
            CallOfDutyRegistration.aggregate([{ $group: { _id: '$eventId', count: { $sum: 1 } } }])
        ]);

        const combined = [...ff, ...bgmi, ...val, ...cod];
        const summary = combined.reduce((acc, curr) => {
            const existing = acc.find(s => curr._id && s._id.toString() === curr._id.toString());
            if (existing) {
                existing.count += curr.count;
            } else if (curr._id) {
                acc.push(curr);
            }
            return acc;
        }, []);

        res.json(summary);
    } catch (error) {
        console.error('Error in all-summary:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get registrations summary by game
// @route   GET /api/registrations/events/summary
// @access  Private/Admin
router.get('/events/summary', protect, admin, async (req, res) => {
    try {
        const { game } = req.query;
        const Model = getModelByGame(game);

        if (!Model) {
            return res.status(400).json({ message: 'Invalid game type' });
        }

        const registrations = await Model.aggregate([
            {
                $group: {
                    _id: '$eventId',
                    count: { $sum: 1 },
                    eventTitle: { $first: '$eventTitle' }
                }
            }
        ]);

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new registration
// @route   POST /api/registrations
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { game, eventId, eventTitle, ...registrationData } = req.body;

        // Check if user is an admin or super admin
        if (req.user.role !== 'user') {
            return res.status(403).json({ message: 'Super Admins and Admins are not allowed to participate in events with their main accounts.' });
        }

        const Model = getModelByGame(game);
        if (!Model) {
            return res.status(400).json({ message: 'Invalid game type' });
        }

        // 0. Check if registration is open and slots are available
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!event.is_registration_open) {
            return res.status(400).json({ message: 'Registrations for this event are currently closed.' });
        }

        const currentRegsCount = await Model.countDocuments({ eventId });
        if (event.max_participants && currentRegsCount >= event.max_participants) {
            return res.status(400).json({ message: 'Registration full: All slots for this event have been filled.' });
        }

        // Get all member emails and roles
        const rolesToCheck = ['teamLead', 'player2', 'player3', 'player4', 'player5'];
        const memberEmails = [];
        rolesToCheck.forEach(role => {
            if (registrationData[role] && registrationData[role].email) {
                memberEmails.push(registrationData[role].email.toLowerCase());
            }
        });

        // 1. Verify all team members have accounts
        const registeredUsers = await User.find({ email: { $in: memberEmails } });
        const registeredEmails = registeredUsers.map(u => u.email.toLowerCase());
        const missingEmails = memberEmails.filter(email => !registeredEmails.includes(email));

        if (missingEmails.length > 0) {
            return res.status(400).json({
                message: `The following users have not created an account: ${missingEmails.join(', ')}`
            });
        }

        // Check if any team member is an admin or super admin
        const adminUsers = registeredUsers.filter(u => u.role !== 'user');
        if (adminUsers.length > 0) {
            return res.status(403).json({
                message: `Super Admins and Admins represent the organization and cannot participate as players: ${adminUsers.map(u => u.email).join(', ')}`
            });
        }

        // 2. Check if ANY team member is already registered for this event
        // This covers both Team Lead and all other players
        const orConditions = rolesToCheck.map(role => ({
            [`${role}.email`]: { $in: memberEmails }
        }));

        const existingRegistration = await Model.findOne({
            eventId,
            $or: orConditions
        });

        if (existingRegistration) {
            return res.status(400).json({ message: 'One or more players in your team are already registered for this event.' });
        }

        // 3. Check if Team Name is already taken for this event
        const existingTeam = await Model.findOne({
            eventId,
            teamName: { $regex: new RegExp(`^${registrationData.teamName}$`, 'i') }
        });

        if (existingTeam) {
            return res.status(400).json({ message: `Team Name "${registrationData.teamName}" is already registered for this event.` });
        }

        // 4. Check for duplicate identifiers (CollegeId, Mobile, Game IDs) across all roles
        const identifiersToCheck = [
            { key: 'collegeId', label: 'College ID' },
            { key: 'mobileNumber', label: 'Mobile Number' },
            { key: 'inGameName', label: 'In-Game Name' },
            { key: 'riotId', label: 'Riot ID' } // For Valorant
        ];

        for (const identifier of identifiersToCheck) {
            const valuesToCheck = [];
            rolesToCheck.forEach(role => {
                if (registrationData[role] && registrationData[role][identifier.key]) {
                    valuesToCheck.push(registrationData[role][identifier.key]);
                }
            });

            if (valuesToCheck.length > 0) {
                const identifierOrConditions = rolesToCheck.map(role => ({
                    [`${role}.${identifier.key}`]: { $in: valuesToCheck }
                }));

                const conflict = await Model.findOne({
                    eventId,
                    $or: identifierOrConditions
                });

                if (conflict) {
                    return res.status(400).json({
                        message: `Duplicate Registration: A player with ${identifier.label} is already registered for this event.`
                    });
                }
            }
        }

        const registration = new Model({
            eventId,
            eventTitle,
            userId: req.user._id,
            game,
            ...registrationData
        });

        const savedRegistration = await registration.save();

        // 5. Fetch full event details and push to ALL team members' profiles
        const registrationSummary = {
            registrationId: savedRegistration._id,
            eventId,
            eventTitle,
            game,
            teamName: registrationData.teamName,
            eventDate: event.event_date,
            eventLocation: event.location,
            eventEndTime: event.end_time,
            registeredAt: new Date()
        };

        // Update all users who are part of this team
        await User.updateMany(
            { _id: { $in: registeredUsers.map(u => u._id) } },
            { $push: { registrations: registrationSummary } }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            registration: savedRegistration
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: error.message || 'Server Error' });
    }
});

// @desc    Get all registrations for an event
// @route   GET /api/registrations/event/:eventId
// @access  Private/Admin
router.get('/event/:eventId', protect, admin, async (req, res) => {
    try {
        const { game } = req.query;
        const Model = getModelByGame(game);

        if (!Model) {
            return res.status(400).json({ message: 'Invalid game type' });
        }

        const registrations = await Model.find({ eventId: req.params.eventId })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all registrations for a game (Admin view)
// @route   GET /api/registrations/game/:game
// @access  Private/Admin
router.get('/game/:game', protect, admin, async (req, res) => {
    try {
        const gameParam = req.params.game;
        const { eventId } = req.query;
        const query = eventId ? { eventId } : {};

        if (gameParam === 'All') {
            const [freefire, bgmi, valorant, cod] = await Promise.all([
                FreeFireRegistration.find(query).populate('userId', 'name email').populate('eventId', 'title event_date end_time').sort({ createdAt: -1 }),
                BGMIRegistration.find(query).populate('userId', 'name email').populate('eventId', 'title event_date end_time').sort({ createdAt: -1 }),
                ValorantRegistration.find(query).populate('userId', 'name email').populate('eventId', 'title event_date end_time').sort({ createdAt: -1 }),
                CallOfDutyRegistration.find(query).populate('userId', 'name email').populate('eventId', 'title event_date end_time').sort({ createdAt: -1 })
            ]);

            const allRegistrations = [...freefire, ...bgmi, ...valorant, ...cod].sort((a, b) => b.createdAt - a.createdAt);
            return res.json(allRegistrations);
        }

        const Model = getModelByGame(gameParam);

        if (!Model) {
            return res.status(400).json({ message: 'Invalid game type' });
        }

        const registrations = await Model.find(query)
            .populate('userId', 'name email')
            .populate('eventId', 'title event_date end_time')
            .sort({ createdAt: -1 });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all registrations across all games (Super Admin)
// @route   GET /api/registrations/all
// @access  Private/SuperAdmin
router.get('/all', protect, superAdmin, async (req, res) => {
    try {
        const [freefire, bgmi, valorant, cod] = await Promise.all([
            FreeFireRegistration.find({}).populate('userId', 'name email').populate('eventId', 'title event_date end_time'),
            BGMIRegistration.find({}).populate('userId', 'name email').populate('eventId', 'title event_date end_time'),
            ValorantRegistration.find({}).populate('userId', 'name email').populate('eventId', 'title event_date end_time'),
            CallOfDutyRegistration.find({}).populate('userId', 'name email').populate('eventId', 'title event_date end_time')
        ]);

        res.json({
            freefire,
            bgmi,
            valorant,
            callOfDuty: cod,
            total: freefire.length + bgmi.length + valorant.length + cod.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get user's registrations (from user profile - permanent)
// @route   GET /api/registrations/my
// @access  Private
router.get('/my', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return registrations stored in user profile (permanent)
        res.json(user.registrations || []);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Remove a registration from user's own history
// @route   DELETE /api/registrations/my/:registrationId
// @access  Private
router.delete('/my/:registrationId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const registration = user.registrations.find(
            reg => reg.registrationId.toString() === req.params.registrationId
        );

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Check if event is completed (ended in the past)
        const endTime = registration.eventEndTime || registration.eventDate;
        if (endTime && new Date(endTime) > new Date()) {
            return res.status(400).json({
                message: 'Cannot remove active event from history. You can only remove past events.'
            });
        }

        user.registrations = user.registrations.filter(
            reg => reg.registrationId.toString() !== req.params.registrationId
        );

        await user.save();
        res.json({ success: true, message: 'Removed from history' });
    } catch (error) {
        console.error('Error removing from history:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get registration by ID
// @route   GET /api/registrations/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const { game } = req.query;
        const Model = getModelByGame(game);

        if (!Model) {
            return res.status(400).json({ message: 'Invalid game type' });
        }

        const registration = await Model.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('eventId', 'title event_date location end_time');

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        res.json(registration);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update registration status
// @route   PUT /api/registrations/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { game, status } = req.body;
        const Model = getModelByGame(game);

        if (!Model) {
            return res.status(400).json({ message: 'Invalid game type' });
        }

        const registration = await Model.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        res.json({ success: true, registration });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete all registrations for an event
// @route   DELETE /api/registrations/event/:eventId
// @access  Private/SuperAdmin
router.delete('/event/:eventId', protect, superAdmin, async (req, res) => {
    try {
        const { game } = req.query;
        let deletedCount = 0;

        if (!game || game === 'All') {
            // If game is not specified or set to All, delete from all registration collections
            const results = await Promise.all([
                FreeFireRegistration.deleteMany({ eventId: req.params.eventId }),
                BGMIRegistration.deleteMany({ eventId: req.params.eventId }),
                ValorantRegistration.deleteMany({ eventId: req.params.eventId }),
                CallOfDutyRegistration.deleteMany({ eventId: req.params.eventId })
            ]);
            deletedCount = results.reduce((acc, curr) => acc + curr.deletedCount, 0);
        } else {
            const Model = getModelByGame(game);
            if (!Model) {
                return res.status(400).json({ message: 'Invalid game type' });
            }
            const result = await Model.deleteMany({ eventId: req.params.eventId });
            deletedCount = result.deletedCount;
        }

        // Synchronize with user profiles - remove all registrations for this event
        await User.updateMany(
            {},
            { $pull: { registrations: { eventId: req.params.eventId } } }
        );

        res.json({ success: true, message: `${deletedCount} registrations deleted`, deletedCount });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete registration
// @route   DELETE /api/registrations/:id
// @access  Private/SuperAdmin
router.delete('/:id', protect, superAdmin, async (req, res) => {
    try {
        const { game } = req.query;
        const Model = getModelByGame(game);

        if (!Model) {
            return res.status(400).json({ message: 'Invalid game type' });
        }

        const registration = await Model.findByIdAndDelete(req.params.id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Synchronize with user profiles - pull this specific registration
        await User.updateMany(
            {},
            { $pull: { registrations: { registrationId: req.params.id } } }
        );

        res.json({ success: true, message: 'Registration deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// End of routes

module.exports = router;
