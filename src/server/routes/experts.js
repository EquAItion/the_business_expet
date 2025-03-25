const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { pool } = require('../server');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};


// Fetch expert profile by ID
router.get('/profiles/:id', async (req, res) => {
    const expertId = req.params.id;
    try {
        const [rows] = await pool.execute('SELECT * FROM expert_profiles WHERE id = ?', [expertId]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: `Expert with ID ${expertId} not found`
            });
        }
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching expert profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expert profile'
        });
    }
});


// Create expert profile
router.post('/profile', verifyToken, async (req, res) => {
    try {
        // Verify user is an expert
        if (req.user.role !== 'expert') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Expert role required.'
            });
        }

        const {
            firstName,
            lastName,
            designation,
            dateOfBirth,
            phoneNumber,
            workExperience,
            currentOrganization,
            location,
            expertise,
            areasOfHelp,
            audioPricing,
            videoPricing,
            chatPricing,
            linkedin,
            instagram,
            youtube,
            twitter
        } = req.body;

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'designation', 'dateOfBirth', 'phoneNumber', 
            'workExperience', 'currentOrganization', 'location', 'expertise', 'areasOfHelp', 
            'audioPricing', 'videoPricing', 'chatPricing'];
        
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Check if profile already exists
        const [existingProfiles] = await pool.execute(
            'SELECT id FROM expert_profiles WHERE user_id = ?',
            [req.user.id]
        );

        if (existingProfiles.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Expert profile already exists'
            });
        }

        // Validate date format
        const dateOfBirthObj = new Date(dateOfBirth);
        if (isNaN(dateOfBirthObj.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format for date of birth'
            });
        }

        // Create expert profile
        const profileId = uuidv4();
        await pool.execute(
            `INSERT INTO expert_profiles (
                id, user_id, first_name, last_name, designation, date_of_birth,
                phone_number, work_experience, current_organization, location,
                expertise, areas_of_help, audio_pricing, video_pricing, chat_pricing,
                linkedin_url, instagram_url, youtube_url, twitter_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                profileId,
                req.user.id,
                firstName,
                lastName,
                designation,
                dateOfBirth,
                phoneNumber,
                workExperience,
                currentOrganization,
                location,
                expertise,
                areasOfHelp,
                parseFloat(audioPricing),
                parseFloat(videoPricing),
                parseFloat(chatPricing),
                linkedin || null,
                instagram || null,
                youtube || null,
                twitter || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Expert profile created successfully',
            data: {
                id: profileId,
                userId: req.user.id,
                firstName,
                lastName,
                designation,
                dateOfBirth,
                phoneNumber,
                workExperience,
                currentOrganization,
                location,
                expertise,
                areasOfHelp,
                audioPricing,
                videoPricing,
                chatPricing,
                linkedinUrl: linkedin,
                instagramUrl: instagram,
                youtubeUrl: youtube,
                twitterUrl: twitter
            }
        });
    } catch (error) {
        console.error('Error creating expert profile:', error);
        
        // Handle specific database errors
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user reference. Please ensure you are logged in with a valid account.'
            });
        } else if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'A profile already exists for this user.'
            });
        } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
            return res.status(400).json({
                success: false,
                message: 'Invalid data format. Please check all field values.'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors
            });
        }

        // Handle database connection errors
        if (error.code === 'ECONNREFUSED' || error.code === 'PROTOCOL_CONNECTION_LOST') {
            return res.status(503).json({
                success: false,
                message: 'Database connection error. Please try again later.'
            });
        }

        // Handle other database errors
        if (error.code && error.code.startsWith('ER_')) {
            return res.status(400).json({
                success: false,
                message: 'Database error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Invalid data provided'
            });
        }

        // Handle any other unexpected errors
        res.status(500).json({
            success: false,
            message: 'Error creating expert profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
        
        // Log the full error for debugging
        console.error('Detailed error creating expert profile:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
    }
});

// Get expert profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const [profiles] = await pool.execute(
            'SELECT * FROM expert_profiles WHERE user_id = ?',
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found'
            });
        }

        res.json({
            success: true,
            data: profiles[0]
        });
    } catch (error) {
        console.error('Error fetching expert profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expert profile'
        });
    }
});

// Get all expert profiles
router.get('/profiles', async (req, res) => {
    try {
        const [profiles] = await pool.execute(
            'SELECT id, first_name, last_name, designation, work_experience, current_organization, location, expertise, areas_of_help FROM expert_profiles'
        );

        if (profiles.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        const formattedProfiles = profiles.map(profile => ({
            id: profile.id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            designation: profile.designation,
            workExperience: profile.work_experience,
            currentOrganization: profile.current_organization,
            location: profile.location,
            expertise: profile.expertise,
            areasOfHelp: profile.areas_of_help
        }));

        res.json({
            success: true,
            data: formattedProfiles
        });
    } catch (error) {
        console.error('Error fetching expert profiles:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expert profiles'
        });
    }
});

// Update expert profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        // Verify user is an expert
        if (req.user.role !== 'expert') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Expert role required.'
            });
        }

        const {
            firstName,
            lastName,
            designation,
            dateOfBirth,
            phoneNumber,
            workExperience,
            currentOrganization,
            location,
            expertise,
            areasOfHelp,
            audioPricing,
            videoPricing,
            chatPricing,
            linkedinUrl,
            instagramUrl,
            youtubeUrl,
            twitterUrl
        } = req.body;

        // Update expert profile
        await pool.execute(
            `UPDATE expert_profiles SET
                first_name = ?,
                last_name = ?,
                designation = ?,
                date_of_birth = ?,
                phone_number = ?,
                work_experience = ?,
                current_organization = ?,
                location = ?,
                expertise = ?,
                areas_of_help = ?,
                audio_pricing = ?,
                video_pricing = ?,
                chat_pricing = ?,
                linkedin_url = ?,
                instagram_url = ?,
                youtube_url = ?,
                twitter_url = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?`,
            [
                firstName,
                lastName,
                designation,
                dateOfBirth,
                phoneNumber,
                workExperience,
                currentOrganization,
                location,
                expertise,
                areasOfHelp,
                audioPricing,
                videoPricing,
                chatPricing,
                linkedinUrl || null,
                instagramUrl || null,
                youtubeUrl || null,
                twitterUrl || null,
                req.user.id
            ]
        );

        res.json({
            success: true,
            message: 'Expert profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating expert profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating expert profile'
        });
    }
});

// Get expert profile by ID
router.get('/profiles/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [profiles] = await pool.execute(
            'SELECT * FROM expert_profiles WHERE id = ?',
            [id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found'
            });
        }

        const profile = profiles[0];
        const formattedProfile = {
            id: profile.id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            designation: profile.designation,
            dateOfBirth: profile.date_of_birth,
            phoneNumber: profile.phone_number,
            workExperience: profile.work_experience,
            currentOrganization: profile.current_organization,
            location: profile.location,
            expertise: profile.expertise,
            areasOfHelp: profile.areas_of_help,
            audioPricing: profile.audio_pricing,
            videoPricing: profile.video_pricing,
            chatPricing: profile.chat_pricing,
            linkedinUrl: profile.linkedin_url,
            instagramUrl: profile.instagram_url,
            youtubeUrl: profile.youtube_url,
            twitterUrl: profile.twitter_url,
        };

        res.json({
            success: true,
            data: formattedProfile
        });
    } catch (error) {
        console.error('Error fetching expert profile by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expert profile'
        });
    }
});

module.exports = router;