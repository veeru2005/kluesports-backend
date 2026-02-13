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
        fileSize: 10 * 1024 * 1024 // 10MB limit
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
router.post('/event-image', protect, admin, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Image size should be 10MB only' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
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
                    if (!res.headersSent) {
                        return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
                    }
                    return;
                }

                if (!res.headersSent) {
                    res.json({
                        success: true,
                        url: result.secure_url,
                        public_id: result.public_id
                    });
                }
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

    } catch (error) {
        console.error('Upload error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error during image upload' });
        }
    }
});

// @route   POST /api/upload/team-logo
// @desc    Upload team logo to Cloudinary
// @access  Private (Any authenticated user)
router.post('/team-logo', protect, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Image size should be 10MB only' });
            }
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, async (req, res) => {
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
