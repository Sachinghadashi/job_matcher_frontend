const express = require('express');
const router = express.Router();
const { getAllJobs, createJob, updateJob, deleteJob, getRecommendations, getAnalytics } = require('../controllers/jobController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public route (if needed, but usually jobs are protected)
router.get('/', authMiddleware, getAllJobs);

// User: Recommendations
router.get('/recommendations', authMiddleware, getRecommendations);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, createJob);
router.put('/:id', authMiddleware, adminMiddleware, updateJob);
router.delete('/:id', authMiddleware, adminMiddleware, deleteJob);
router.get('/analytics', authMiddleware, adminMiddleware, getAnalytics);

module.exports = router;
