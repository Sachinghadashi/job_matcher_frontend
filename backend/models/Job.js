const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    job_id: { type: String, required: true, unique: true }, // For matching with ML Dataset
    title: { type: String, required: true },
    company: { type: String, required: true },
    category: { type: String, required: true },
    skills_required: { type: [String], required: true },
    location: { type: String, required: true },
    salary: { type: String, required: true },
    description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
