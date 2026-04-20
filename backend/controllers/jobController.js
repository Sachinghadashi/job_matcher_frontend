const Job = require('../models/Job');
const User = require('../models/User');
const axios = require('axios');

// Admin: Get all jobs
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find();
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin: Create new Job
exports.createJob = async (req, res) => {
    try {
        const job = new Job(req.body);
        await job.save();
        res.status(201).json(job);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin: Update job
exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.status(200).json(job);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin: Delete job
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// User: Get Job Recommendations from ML Service
exports.getRecommendations = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.skills || user.skills.length === 0) {
            return res.status(400).json({ message: 'Please add skills to your profile to get recommendations.' });
        }

        // Call ML Service
        const mlResponse = await axios.post(`${process.env.ML_SERVICE_URL}/recommend-jobs`, {
            skills: user.skills
        });

        // The ML service returns an array of matched jobs (dicts)
        const recommendedJobs = mlResponse.data.matches;
        res.status(200).json(recommendedJobs);
    } catch (error) {
        console.error("ML Service Error:", error.message);
        res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
    }
};

// Admin: Analytics
exports.getAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalJobs = await Job.countDocuments();
        
        // Count skills from jobs
        const jobs = await Job.find();
        const skillCounts = {};
        jobs.forEach(job => {
            job.skills_required.forEach(skill => {
                skill = skill.toLowerCase().trim();
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });

        // Sort skills by demand
        const topSkills = Object.entries(skillCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([skill, count]) => ({ skill, count }));

        res.status(200).json({ totalUsers, totalJobs, topSkills });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
