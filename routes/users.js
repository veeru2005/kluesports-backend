const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, superAdmin, admin } = require('../middleware/authMiddleware');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const users = await User.find({ isVerified: true }).select('-password -otp -otpExpires -tempEmail -isEmailChangeAuthorized');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Check if email exists
// @route   GET /api/users/check-email/:email
// @access  Private
router.get('/check-email/:email', protect, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() })
            .select('name email collegeId mobile inGameName inGameId role');
        if (user) {
            res.json({ exists: true, user });
        } else {
            res.json({ exists: false, message: 'This user has not created an account' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all admins
// @route   GET /api/users/admins
// @access  Private/SuperAdmin
router.get('/admins', protect, superAdmin, async (req, res) => {
    try {
        // Only return game-specific admins, not super_admin
        const allAdmins = await User.find({
            role: { $in: ['admin_freefire', 'admin_bgmi', 'admin_valorant', 'admin_call_of_duty'] },
            isVerified: true
        }).select('-password -otp -otpExpires -tempEmail -isEmailChangeAuthorized');
        res.json(allAdmins);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/SuperAdmin
router.get('/:id', protect, superAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Check for duplicate collegeId
            if (req.body.collegeId && req.body.collegeId !== user.collegeId) {
                const collegeIdExists = await User.findOne({ collegeId: req.body.collegeId });
                if (collegeIdExists) {
                    return res.status(400).json({ message: 'User with this College ID already exists' });
                }
            }



            user.name = req.body.full_name || user.name;
            user.username = req.body.username || user.username;
            user.inGameName = req.body.inGameName || user.inGameName;
            user.collegeId = req.body.collegeId || user.collegeId;
            user.mobile = req.body.mobile || user.mobile;
            user.bio = req.body.bio || user.bio;
            user.inGameId = req.body.inGameId || user.inGameId;
            user.gameYouPlay = req.body.gameYouPlay || user.gameYouPlay;

            if (req.body.email) {
                user.email = req.body.email;
            }

            const updatedUser = await user.save();
            res.json({
                success: true,
                user: {
                    id: updatedUser._id,
                    name: updatedUser.name,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    collegeId: updatedUser.collegeId,
                    mobile: updatedUser.mobile,
                    bio: updatedUser.bio,
                    inGameName: updatedUser.inGameName,
                    inGameId: updatedUser.inGameId,
                    gameYouPlay: updatedUser.gameYouPlay,
                    createdAt: updatedUser.createdAt
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update any user profile (Super Admin)
// @route   PUT /api/users/:id
// @access  Private/SuperAdmin
router.put('/:id', protect, superAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Check for duplicate collegeId
            if (req.body.collegeId && req.body.collegeId !== user.collegeId) {
                const collegeIdExists = await User.findOne({ collegeId: req.body.collegeId });
                if (collegeIdExists) {
                    return res.status(400).json({ message: 'User with this College ID already exists' });
                }
            }



            // Allow updating all fields
            user.name = req.body.name || user.name;
            user.username = req.body.username || user.username;
            user.inGameName = req.body.inGameName || user.inGameName;
            user.collegeId = req.body.collegeId || user.collegeId;
            user.email = req.body.email || user.email;
            user.mobile = req.body.mobile || user.mobile;
            user.role = req.body.role || user.role;
            user.game = req.body.game || user.game;
            user.gameYouPlay = req.body.gameYouPlay || user.gameYouPlay;
            user.inGameId = req.body.inGameId || user.inGameId;

            // Update password if provided
            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();
            res.json({
                id: updatedUser._id,
                name: updatedUser.name,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role,
                game: updatedUser.game
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete a user/member
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Prevent deleting self
            if (user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({ message: 'Cannot delete your own account' });
            }

            // If not super admin, check if they are an admin of the user's game
            if (req.user.role !== 'super_admin') {
                const adminGame = req.user.game;
                const userGame = user.gameYouPlay || user.game;

                if (adminGame !== userGame) {
                    return res.status(403).json({
                        success: false,
                        message: 'Not authorized to delete members from other games'
                    });
                }
            }

            await user.deleteOne();
            res.json({ message: 'User removed successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Add a new admin
// @route   POST /api/users/admins
// @access  Private/SuperAdmin
router.post('/admins', protect, superAdmin, async (req, res) => {
    try {
        const { name, email, mobile, password, role, game, inGameName, inGameId, collegeId, bio } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if collegeId exists
        if (collegeId) {
            const collegeIdExists = await User.findOne({ collegeId });
            if (collegeIdExists) {
                return res.status(400).json({ message: 'User with this College ID already exists' });
            }
        }



        // Validate role
        const validAdminRoles = ['admin_freefire', 'admin_bgmi', 'admin_valorant', 'admin_call_of_duty'];
        if (!validAdminRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid admin role' });
        }

        if (!inGameName) {
            return res.status(400).json({ message: 'In-Game Name is required for admins' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin - use In-Game Name as username if possible
        const admin = await User.create({
            name,
            username: inGameName || name, // Prioritize In-Game Name for username
            email,
            mobile,
            password: hashedPassword,
            role,
            game,
            inGameName,
            inGameId,
            collegeId,
            bio,
            isVerified: true
        });

        res.status(201).json({
            id: admin._id,
            name: admin.name,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            game: admin.game,
            inGameName: admin.inGameName,
            inGameId: admin.inGameId,
            collegeId: admin.collegeId,
            bio: admin.bio
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Update admin role/permissions
// @route   PUT /api/users/admins/:id
// @access  Private/SuperAdmin
router.put('/admins/:id', protect, superAdmin, async (req, res) => {
    try {
        const admin = await User.findById(req.params.id);

        if (admin) {
            // Check for duplicate collegeId
            if (req.body.collegeId && req.body.collegeId !== admin.collegeId) {
                const collegeIdExists = await User.findOne({ collegeId: req.body.collegeId });
                if (collegeIdExists) {
                    return res.status(400).json({ message: 'User with this College ID already exists' });
                }
            }



            // Update admin fields
            admin.name = req.body.name || admin.name;
            admin.username = req.body.inGameName || req.body.name || admin.username; // Keep username in sync with IGN or name
            admin.email = req.body.email || admin.email;
            admin.mobile = req.body.mobile || admin.mobile;
            admin.role = req.body.role || admin.role;
            admin.game = req.body.game || admin.game;
            admin.inGameName = req.body.inGameName || admin.inGameName;
            admin.inGameId = req.body.inGameId || admin.inGameId;
            admin.collegeId = req.body.collegeId || admin.collegeId;
            admin.bio = req.body.bio || admin.bio;

            // Update password if provided
            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                admin.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedAdmin = await admin.save();
            res.json({
                id: updatedAdmin._id,
                name: updatedAdmin.name,
                username: updatedAdmin.username,
                email: updatedAdmin.email,
                role: updatedAdmin.role,
                game: updatedAdmin.game,
                inGameName: updatedAdmin.inGameName,
                inGameId: updatedAdmin.inGameId,
                collegeId: updatedAdmin.collegeId,
                bio: updatedAdmin.bio
            });
        } else {
            res.status(404).json({ message: 'Admin not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Change a user's played game (Super Admin)
// @route   PATCH /api/users/:id/game
// @access  Private/SuperAdmin
router.patch('/:id/game', protect, superAdmin, async (req, res) => {
    try {
        const { gameYouPlay } = req.body;

        const validGames = ['Free Fire', 'BGMI', 'Valorant', 'Call Of Duty'];

        if (!gameYouPlay || !validGames.includes(gameYouPlay)) {
            return res.status(400).json({ success: false, message: 'Invalid or missing gameYouPlay value' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.gameYouPlay = gameYouPlay;
        await user.save();

        res.json({ success: true, id: user._id, gameYouPlay: user.gameYouPlay });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Remove admin role (convert to user or delete)
// @route   DELETE /api/users/admins/:id
// @access  Private/SuperAdmin
router.delete('/admins/:id', protect, superAdmin, async (req, res) => {
    try {
        const admin = await User.findById(req.params.id);

        if (admin) {
            // Prevent deleting super admin
            if (admin.role === 'super_admin') {
                return res.status(400).json({ message: 'Cannot delete super admin' });
            }

            await admin.deleteOne();
            res.json({ message: 'Admin removed successfully' });
        } else {
            res.status(404).json({ message: 'Admin not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
