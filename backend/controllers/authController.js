const User = require('../models/User');
const jwt = require('jsonwebtoken');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const errors = {};
        if (!name || name.trim().length < 2) errors.name = "Name must be at least 2 characters.";
        if (!email) errors.email = "Email address is required.";
        else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Please provide a valid email format.";
        if (!password || password.length < 6) errors.password = "Password must be at least 6 characters long.";
        
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ errors: { email: 'An account with this email already exists.' } });
        }

        const user = new User({ name, email, password, role });
        await user.save();

        const token = generateToken(user);
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true if using HTTPS
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });
        res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const errors = {};
        if (!email) errors.email = "Email address is required.";
        else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Please provide a valid email format.";
        if (!password) errors.password = "Password is required.";
        
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ errors });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ errors: { email: 'No account found with this email.' } });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ errors: { password: 'Incorrect password provided.' } });
        }

        const token = generateToken(user);
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.status(200).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, skills: user.skills } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.logout = async (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { skills, experience, education } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, { skills, experience, education }, { new: true }).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Known technology skills database derived from ML datasets
const KNOWN_SKILLS = [
    'react', 'javascript', 'html', 'css', 'bootstrap', 'frontend', 
    'nodejs', 'express', 'mongodb', 'api', 'backend', 'database', 
    'fullstack', 'python', 'machine learning', 'scikit-learn', 'pandas', 
    'numpy', 'ai', 'tensorflow', 'keras', 'deep learning', 'aws', 
    'docker', 'kubernetes', 'linux', 'ci/cd', 'jenkins', 'figma', 
    'adobe xd', 'sketch', 'design', 'ui', 'ux', 'agile', 'scrum', 
    'leadership', 'product', 'jira', 'sql', 'excel', 'tableau', 
    'analytics', 'azure', 'gcp', 'architecture', 'cloud', 'java', 'c++', 'c#'
];

exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No resume file uploaded. Please attach a .pdf or .docx file.' });
        }

        let rawText = '';
        const fileExt = req.file.originalname.split('.').pop().toLowerCase();

        if (fileExt === 'pdf') {
            const data = await pdfParse(req.file.buffer);
            rawText = data.text;
        } else if (fileExt === 'docx') {
            const result = await mammoth.extractRawText({ buffer: req.file.buffer });
            rawText = result.value;
        } else {
            return res.status(400).json({ message: 'Unsupported file type. Please upload a PDF or DOCX file.' });
        }

        const lowerText = rawText.toLowerCase();
        
        // Extract matching skills
        const extractedSkills = KNOWN_SKILLS.filter(skill => {
            // Use regex boundaries to match full words/phrases securely
            const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
            const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
            return regex.test(lowerText);
        });

        res.status(200).json({ 
            message: 'Resume parsed successfully', 
            skills: extractedSkills 
        });

    } catch (error) {
        console.error('Resume Parse Error:', error);
        res.status(500).json({ message: 'Failed to parse resume', error: error.message });
    }
};
