const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Create seeker profile
router.post('/seeker', auth, async (req, res) => {
    try {
        // Get db from request object
        const db = req.app.locals.db;
        
        if (!db) {
            throw new Error('Database connection not available');
        }
        
        console.log('Request body:', req.body);
        console.log('User ID from token:', req.userId);
        
        // Try to get userId from either token or request body
        const userId = req.userId || req.body.userId;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: userId'
            });
        }
        
        // Check each required field individually
        const requiredFields = ['email', 'name', 'industry', 'company', 'position', 
                               'experience', 'location', 'bio', 'interests'];
                               
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields: missingFields
            });
        }
        
        const {
            email,
            name,
            industry,
            company,
            position,
            experience,
            location,
            bio,
            interests,
            linkedin,
            website
        } = req.body;

        // Insert into seeker_profiles table
        try {
            const [result] = await db.execute(
                `INSERT INTO seeker_profiles (
                    user_id, name, email, industry, company, position, 
                    experience, location, bio, interests, linkedin_url, website_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId, name, email, industry, company, position,
                    experience, location, bio, interests, linkedin || '', website || ''
                ]
            );
            
            // Update users table to mark profile as complete
            await db.execute(
                `UPDATE users SET profile_completed = 1 WHERE id = ?`,
                [userId]
            );

            res.status(201).json({
                success: true,
                message: 'Seeker profile created successfully',
                data: {
                    profileId: result.insertId
                }
            });
        } catch (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Database error while creating profile',
                error: dbError.message,
                code: dbError.code
            });
        }
    } catch (error) {
        console.error('Error creating seeker profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create seeker profile',
            error: error.message
        });
    }
});

// Get seeker profile by user ID
router.get('/seeker/:userId', auth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        
        if (!db) {
            throw new Error('Database connection not available');
        }
        
        const userId = req.params.userId;
        
        // Verify that the requesting user can access this profile
        if (req.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access to profile'
            });
        }
        
        // Get profile from database
        const [profiles] = await db.execute(
            `SELECT * FROM seeker_profiles WHERE user_id = ?`,
            [userId]
        );
        
        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }
        
        // Return the profile
        res.status(200).json({
            success: true,
            profile: profiles[0]
        });
    } catch (error) {
        console.error('Error fetching seeker profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seeker profile',
            error: error.message
        });
    }
});

module.exports = router;