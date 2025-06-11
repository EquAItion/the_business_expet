const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Update the validation function to match DB schema
const validateProfileData = (body) => {
    const requiredFields = [
        'user_id',
        'name', 
        'email',
        'company',
        'position',
        'experience',
        'location',
        'bio',
        'interests'
    ];

    const missingFields = requiredFields.filter(field => !body[field]?.trim());
    
    // URL validations - match DB column names
    if (body.linkedin_url && !body.linkedin_url.match(/^https?:\/\/.+/)) {
        missingFields.push('Invalid linkedin_url format');
    }
    if (body.website_url && !body.website_url.match(/^https?:\/\/.+/)) {
        missingFields.push('Invalid website_url format');
    }

    return missingFields;
};

// Create seeker profile
router.post('/seeker', auth, async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.db.getConnection();
        
        const user_id = req.user?.id || req.body.user_id;
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: user_id'
            });
        }

        const missingFields = validateProfileData(req.body);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: missingFields
            });
        }

        const {
            name,
            email,
            company,
            position,
            experience,
            location,
            bio,
            interests,
            linkedin_url,
            website_url
        } = req.body;

        // Start transaction
        await connection.beginTransaction();

        try {
            // First insert the profile
            const [result] = await connection.execute(
                `INSERT INTO seeker_profiles (
                    user_id,
                    name,
                    email,
                    company,
                    position,
                    experience,
                    location,
                    bio,
                    interests,
                    linkedin_url,
                    website_url,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    user_id,
                    name.trim(),
                    email.toLowerCase(),
                    company.trim(),
                    position.trim(),
                    experience.trim(),
                    location.trim(),
                    bio.trim(),
                    interests.trim(),
                    linkedin_url?.trim() || null,
                    website_url?.trim() || null
                ]
            );

            // Update users table without updated_at field
            await connection.execute(
                `UPDATE users 
                 SET profile_completed = 1
                 WHERE id = ?`,
                [user_id]
            );

            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Profile created successfully',
                data: {
                    id: result.insertId,
                    user_id
                }
            });

        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        }

    } catch (error) {
        console.error('Profile creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create profile',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// Update the get profile route
router.get('/seeker/:userId', auth, async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.db.getConnection();
        
        // Updated SELECT to match DB schema
        const [profiles] = await connection.execute(`
            SELECT 
                sp.*,
                u.email
            FROM seeker_profiles sp
            JOIN users u ON sp.user_id = u.id
            WHERE sp.user_id = ?
        `, [req.params.userId]);

        if (!profiles || profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        res.json({
            success: true,
            data: profiles[0]
        });

    } catch (error) {
        console.error('Error fetching seeker profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;