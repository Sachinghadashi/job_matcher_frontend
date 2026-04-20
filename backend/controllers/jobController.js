const Job = require('../models/Job');
const User = require('../models/User');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Helper to sync MongoDB jobs to jobs.csv for ML Service (Local Development Only)
const syncJobsToCSV = async () => {
    // Skip this in production as ML service reads from DB directly
    if (process.env.NODE_ENV === 'production') return;

    try {
        const jobs = await Job.find().lean();
        const csvPath = path.join(__dirname, '../../ml-service/data/jobs.csv');
        
        // Ensure directory exists before writing
        const dir = path.dirname(csvPath);
        if (!fs.existsSync(dir)) return;

        // Define Header
        let csvContent = "job_id,title,company,category,skills_required,location,salary\n";
        
        // Build rows
        jobs.forEach(job => {
            const row = [
                job.job_id,
                `"${job.title.replace(/"/g, '""')}"`,
                `"${job.company.replace(/"/g, '""')}"`,
                `"${job.category.replace(/"/g, '""')}"`,
                `"${job.skills_required.join(', ').replace(/"/g, '""')}"`,
                `"${job.location.replace(/"/g, '""')}"`,
                `"${job.salary.replace(/"/g, '""')}"`
            ].join(',');
            csvContent += row + "\n";
        });

        fs.writeFileSync(csvPath, csvContent, 'utf8');
    } catch (error) {
        console.error("Local CSV sync skipped:", error.message);
    }
};

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
        
        // Sync to CSV after save
        await syncJobsToCSV();
        
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
        
        // Sync to CSV after update
        await syncJobsToCSV();
        
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
        
        // Sync to CSV after deletion
        await syncJobsToCSV();
        
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
// Admin: Sync MongoDB jobs FROM jobs.csv (Import manual edits)
exports.syncCSVToDB = async (req, res) => {
    try {
        const csvPath = path.join(__dirname, '../../ml-service/data/jobs.csv');
        if (!fs.existsSync(csvPath)) {
            return res.status(404).json({ message: 'CSV file not found' });
        }

        const csvData = fs.readFileSync(csvPath, 'utf8');
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        const jobsToSync = [];

        // Simple CSV parser that handles quotes
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            // Regex to split by comma but ignore commas inside quotes
            const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!matches || matches.length < 7) continue;

            const jobData = {
                job_id: matches[0].replace(/"/g, ''),
                title: matches[1].replace(/"/g, ''),
                company: matches[2].replace(/"/g, ''),
                category: matches[3].replace(/"/g, ''),
                skills_required: matches[4].replace(/"/g, '').split(',').map(s => s.trim()),
                location: matches[5].replace(/"/g, ''),
                salary: matches[6].replace(/"/g, ''),
                description: 'Imported from ML dataset'
            };
            jobsToSync.push(jobData);
        }

        let updatedCount = 0;
        let createdCount = 0;

        for (const jobData of jobsToSync) {
            const existingJob = await Job.findOne({ job_id: jobData.job_id });
            if (existingJob) {
                await Job.findOneAndUpdate({ job_id: jobData.job_id }, jobData);
                updatedCount++;
            } else {
                await new Job(jobData).save();
                createdCount++;
            }
        }

        res.status(200).json({ 
            message: 'CSV Synchronization complete', 
            details: { updated: updatedCount, created: createdCount } 
        });
    } catch (error) {
        console.error("CSV Import Error:", error);
        res.status(500).json({ message: 'Failed to sync from CSV', error: error.message });
    }
};
