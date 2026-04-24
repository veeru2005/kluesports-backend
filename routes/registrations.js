const express = require('express');
const router = express.Router();
const { FreeFireRegistration, BGMIRegistration, ValorantRegistration, CallOfDutyRegistration } = require('../models/Registration');
const User = require('../models/User');
const Event = require('../models/Event');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmail');

// Build a registration confirmation HTML email for the team lead
const buildRegistrationEmail = (teamLeadName, event, registrationData, game) => {
    const startDate = new Date(event.event_date);
    const endDate = new Date(event.end_time);

    const dateStr = startDate.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Kolkata'
    });
    const startTimeStr = startDate.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    }).replace(/am|pm/gi, s => s.toUpperCase());
    const endTimeStr = endDate.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'
    }).replace(/am|pm/gi, s => s.toUpperCase());

    const roles = ['teamLead', 'player2', 'player3', 'player4', 'player5'];
    const playerRows = roles
        .filter(role => registrationData[role] && registrationData[role].email)
        .map((role, idx) => {
            const p = registrationData[role];
            const gameId = p.riotId || p.inGameName || '-';
            const roleLabel = role === 'teamLead' ? 'Team Lead' : `Player ${idx + 1}`;
            return `
            <tr style="border-bottom:1px solid #1f1f1f;">
                <td style="padding:7px 10px;color:#dc2626;font-weight:600;font-size:12px;white-space:nowrap;">${roleLabel}</td>
                <td style="padding:7px 10px;color:#d1d1d1;font-size:12px;">${p.name}</td>
                <td style="padding:7px 10px;color:#a1a1aa;font-size:12px;">${p.collegeId}</td>
                <td style="padding:7px 10px;color:#a1a1aa;font-size:12px;">${gameId}</td>
            </tr>`;
        }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:Verdana,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#09090b;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#121212;border:2px solid #dc2626;border-radius:12px;overflow:hidden;">

        <!-- BADGE -->
        <tr>
          <td align="center" style="padding:30px 15px 10px 15px;background-color:#121212;">
            <div style="display:inline-block;background-color:#16a34a;color:#fefefe;padding:7px 16px;border-radius:20px;font-size:12px;font-weight:bold;letter-spacing:0.5px;">✅ Registration Confirmed</div>
          </td>
        </tr>

        <!-- HEADER -->
        <tr>
          <td align="center" style="padding:20px 30px 30px 30px;border-bottom:2px solid #dc2626;background-color:#121212;">
            <img src="https://res.cloudinary.com/djzocjzl7/image/upload/v1772465624/Logo1_kbdvpg.png" width="80" height="80" alt="KLU ESPORTS" style="display:block;border-radius:50%;border:2px solid #dc2626;margin:0 auto 16px auto;">
            <h1 style="margin:0;font-size:24px;letter-spacing:1px;">
              <span style="color:#d1d1d1;font-weight:900;">KLU</span> <span style="color:#dc2626;font-weight:900;">ESPORTS</span>
            </h1>

          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px 28px;background-color:#121212;">
            <p style="color:#d1d1d1;font-size:15px;margin:0 0 6px;">Hi <strong style="color:#dc2626;">${teamLeadName}</strong>,</p>
            <p style="color:#a1a1aa;font-size:13px;margin:0 0 24px;">Your team has been successfully registered. Here are your event and team details:</p>

            <!-- Event Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;border-radius:8px;margin-bottom:20px;border:1px solid #dc2626;">
              <tr><td style="padding:12px 18px;border-bottom:1px solid #dc2626;">
                <p style="margin:0;color:#dc2626;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Event Details</p>
              </td></tr>
              <tr><td style="padding:16px 18px;">
                <table width="100%" cellpadding="5">
                  <tr>
                    <td style="color:#71717a;font-size:12px;width:36%;">Event</td>
                    <td style="color:#d1d1d1;font-size:13px;font-weight:700;">${event.title}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">Game</td>
                    <td style="color:#d1d1d1;font-size:13px;">${game}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">Date</td>
                    <td style="color:#d1d1d1;font-size:13px;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">Time</td>
                    <td style="color:#d1d1d1;font-size:13px;">${startTimeStr} – ${endTimeStr}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">Venue</td>
                    <td style="color:#d1d1d1;font-size:13px;">${event.location}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:12px;">Team Name</td>
                    <td style="color:#dc2626;font-size:14px;font-weight:700;">${registrationData.teamName}</td>
                  </tr>
                </table>
              </td></tr>
            </table>

            <!-- Team Members -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f0f;border-radius:8px;margin-bottom:20px;border:1px solid #dc2626;overflow:hidden;">
              <tr><td colspan="4" style="padding:12px 18px;border-bottom:1px solid #dc2626;">
                <p style="margin:0;color:#dc2626;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Team Members</p>
              </td></tr>
              <tr style="background-color:#09090b;">
                <th style="padding:7px 10px;color:#71717a;font-size:10px;text-align:left;font-weight:600;text-transform:uppercase;">Role</th>
                <th style="padding:7px 10px;color:#71717a;font-size:10px;text-align:left;font-weight:600;text-transform:uppercase;">Name</th>
                <th style="padding:7px 10px;color:#71717a;font-size:10px;text-align:left;font-weight:600;text-transform:uppercase;">College ID</th>
                <th style="padding:7px 10px;color:#71717a;font-size:10px;text-align:left;font-weight:600;text-transform:uppercase;">IGN</th>
              </tr>
              ${playerRows}
            </table>

            <!-- 15-min Reminder Notice -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a0000;border-radius:8px;border:1px solid #dc2626;margin-bottom:20px;">
              <tr><td style="padding:14px 18px;">
                <p style="margin:0 0 5px;color:#dc2626;font-size:13px;font-weight:700;">⏰ Important – Be Early!</p>
                <p style="margin:0;color:#a1a1aa;font-size:12px;">Your match starts at <strong style="color:#d1d1d1;">${startTimeStr}</strong>. <strong style="color:#fca5a5;">You and your entire team must be present at the venue at least 30 minutes before the match.</strong> Late arrivals may result in disqualification. Plan accordingly!</p>
              </td></tr>
            </table>

            <p style="color:#71717a;font-size:12px;margin:0;text-align:center;">All the best from the KLU ESPORTS TEAM! 🎮</p>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" style="padding:20px 15px;background-color:#0f0f0f;border-top:2px solid #dc2626;">
            <div style="margin-bottom:10px;white-space:nowrap;">
              <a href="https://www.instagram.com/klu__esports/" style="margin:0 4px;text-decoration:none;display:inline-block;color:#dc2626;font-size:11px;"><img src="https://cdn-icons-png.flaticon.com/128/174/174855.png" alt="Instagram" style="width:13px;height:13px;vertical-align:middle;margin-right:3px;">Instagram</a>
              <span style="color:#71717a;">|</span>
              <a href="https://discord.com/invite/pp9wnEjbt" style="margin:0 4px;text-decoration:none;display:inline-block;color:#dc2626;font-size:11px;"><img src="https://cdn-icons-png.flaticon.com/128/5968/5968756.png" alt="Discord" style="width:13px;height:13px;vertical-align:middle;margin-right:3px;">Discord</a>
              <span style="color:#71717a;">|</span>
              <a href="https://www.youtube.com/@esports.kluniversity" style="margin:0 4px;text-decoration:none;display:inline-block;color:#dc2626;font-size:11px;"><img src="https://cdn-icons-png.flaticon.com/128/1384/1384060.png" alt="YouTube" style="width:13px;height:13px;vertical-align:middle;margin-right:3px;">YouTube</a>
              <span style="color:#71717a;">|</span>
              <a href="https://www.linkedin.com/company/kl-esports-club" style="margin:0 4px;text-decoration:none;display:inline-block;color:#dc2626;font-size:11px;"><img src="https://cdn-icons-png.flaticon.com/128/174/174857.png" alt="LinkedIn" style="width:13px;height:13px;vertical-align:middle;margin-right:3px;">LinkedIn</a>
            </div>
            <p style="color:#71717a;font-size:11px;margin:10px 0 0;">© 2026 KLU ESPORTS CLUB. All rights reserved.</p>
            <p style="color:#71717a;font-size:10px;margin:6px 0 0;">Designed and Developed by <a href="https://www.veerendra-portfolio.in/" target="_blank" style="color:#dc2626;text-decoration:none;">S. Veerendra Chowdary</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

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

        // 6. Send confirmation email to team lead
        try {
            const teamLeadEmail = registrationData.teamLead && registrationData.teamLead.email;
            const teamLeadName = registrationData.teamLead && registrationData.teamLead.name;
            if (teamLeadEmail) {
                const emailHtml = buildRegistrationEmail(teamLeadName, event, registrationData, game);
                await sendEmail(
                    teamLeadEmail,
                    `Registration Confirmed – ${eventTitle} | KLU Esports`,
                    emailHtml
                );
            }
        } catch (emailErr) {
            // Email failure should not block the registration response
            console.error('Registration confirmation email failed:', emailErr.message);
        }

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

// Helper to validate game admin access
const validateGameAccess = (user, game) => {
    if (user.role === 'super_admin') return true;
    if (user.role === 'admin_freefire' && game === 'Free Fire') return true;
    if (user.role === 'admin_bgmi' && game === 'BGMI') return true;
    if (user.role === 'admin_valorant' && game === 'Valorant') return true;
    if (user.role === 'admin_call_of_duty' && game === 'Call Of Duty') return true;
    return false;
};

// @desc    Delete all registrations for an event
// @route   DELETE /api/registrations/event/:eventId
// @access  Private/Admin or SuperAdmin
router.delete('/event/:eventId', protect, admin, async (req, res) => {
    try {
        const { game } = req.query;

        if (req.user.role !== 'super_admin' && (!game || !validateGameAccess(req.user, game))) {
            return res.status(403).json({ message: 'Not authorized to delete registrations for this game' });
        }

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
// @access  Private/Admin or SuperAdmin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const { game } = req.query;

        if (req.user.role !== 'super_admin' && (!game || !validateGameAccess(req.user, game))) {
            return res.status(403).json({ message: 'Not authorized to delete registrations for this game' });
        }

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
