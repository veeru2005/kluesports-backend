const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const { protect, admin } = require('../middleware/authMiddleware');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// @route   POST /api/upload/event-image
// @desc    Upload event image to Cloudinary
// @access  Private/Admin
router.post('/event-image', protect, admin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Upload to Cloudinary using upload_stream
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'klu-esports/events',
                transformation: [
                    { width: 1200, height: 1600, crop: 'limit' },
                    { quality: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
                }

                res.json({
                    success: true,
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );

        // Pipe the buffer to Cloudinary
        const streamifier = require('streamifier');
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error during image upload' });
    }
});

// @route   POST /api/upload/team-logo
// @desc    Upload team logo to Cloudinary
// @access  Private (Any authenticated user)
router.post('/team-logo', protect, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Upload to Cloudinary using upload_stream
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'klu-esports/team-logos',
                transformation: [
                    { width: 500, height: 500, crop: 'limit' }, // Resize if larger than 500x500
                    { quality: 'auto' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({ message: 'Failed to upload logo' });
                }

                res.json({
                    success: true,
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );

        // Pipe the buffer to Cloudinary
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Server error during logo upload' });
    }
});

module.exports = router;
