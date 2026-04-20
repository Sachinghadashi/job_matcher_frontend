const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile, updateProfile, getAllUsers, uploadResume } = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected User Routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/upload-resume', authMiddleware, upload.single('resume'), uploadResume);

// Protected Admin Routes
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);

module.exports = router;
