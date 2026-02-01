const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { protect, superAdmin, admin } = require('../middleware/authMiddleware');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/SuperAdmin
router.get('/', protect, superAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Get all admins
// @route   GET /api/users/admins
// @access  Private/SuperAdmin
router.get('/admins', protect, superAdmin, async (req, res) => {
    try {
        const admins = await User.find({ role: { $regex: '^admin_', $options: 'i' } }); // regex for admin_
        // Also include super_admin if needed, but usually we want to see sub-admins
        const allAdmins = await User.find({
            role: { $in: ['super_admin', 'admin_freefire', 'admin_bgmi', 'admin_valorant', 'admin_call_of_duty'] }
        }).select('-password');
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

// @desc    Update any user profile (Super Admin)
// @route   PUT /api/users/:id
// @access  Private/SuperAdmin
router.put('/:id', protect, superAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
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
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete a user/member
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
router.delete('/:id', protect, superAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Prevent deleting self
            if (user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({ message: 'Cannot delete your own account' });
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
        const { name, username, email, mobile, password, role, game } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Validate role
        const validAdminRoles = ['admin_freefire', 'admin_bgmi', 'admin_valorant', 'admin_call_of_duty'];
        if (!validAdminRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid admin role' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin
        const admin = await User.create({
            name,
            username,
            email,
            mobile,
            password: hashedPassword,
            role,
            game
        });

        res.status(201).json({
            id: admin._id,
            name: admin.name,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            game: admin.game
        });
    } catch (error) {
        console.error('Error creating admin:', error);
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
            // Update admin fields
            admin.name = req.body.name || admin.name;
            admin.username = req.body.username || admin.username;
            admin.email = req.body.email || admin.email;
            admin.mobile = req.body.mobile || admin.mobile;
            admin.role = req.body.role || admin.role;
            admin.game = req.body.game || admin.game;

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
                game: updatedAdmin.game
            });
        } else {
            res.status(404).json({ message: 'Admin not found' });
        }
    } catch (error) {
        console.error('Error updating admin:', error);
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
