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

        // Add validation for numeric fields
        if (isNaN(parseFloat(audioPricing)) || isNaN(parseFloat(videoPricing)) || isNaN(parseFloat(chatPricing))) {
            return res.status(400).json({
                success: false,
                message: 'Pricing fields must be valid numbers'
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
        if (req.user.role !== 'expert') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Expert role required.'
            });
        }

        const {
            first_name,
            last_name,
            designation,
            work_experience,
            current_organization,
            location,
            expertise,
            areas_of_help,
            phone_number,
            video_pricing,
            audio_pricing,
            chat_pricing,
            linkedin,
            twitter,
            instagram
        } = req.body;

        // Validate numeric fields
        if (video_pricing && isNaN(parseFloat(video_pricing)) || 
            audio_pricing && isNaN(parseFloat(audio_pricing)) || 
            chat_pricing && isNaN(parseFloat(chat_pricing))) {
            return res.status(400).json({
                success: false,
                message: 'Pricing fields must be valid numbers'
            });
        }

        const [result] = await pool.execute(
            `UPDATE expert_profiles 
             SET first_name = ?,
                 last_name = ?,
                 designation = ?,
                 work_experience = ?,
                 current_organization = ?,
                 location = ?,
                 expertise = ?,
                 areas_of_help = ?,
                 phone_number = ?,
                 video_pricing = ?,
                 audio_pricing = ?,
                 chat_pricing = ?,
                 linkedin_url = ?,
                 twitter_url = ?,
                 instagram_url = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?`,
            [
                first_name,
                last_name,
                designation,
                work_experience,
                current_organization,
                location,
                expertise,
                areas_of_help,
                phone_number,
                video_pricing,
                audio_pricing,
                chat_pricing,
                linkedin || null,
                twitter || null,
                instagram || null,
                req.user.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found'
            });
        }

        const [updatedProfile] = await pool.execute(
            'SELECT * FROM expert_profiles WHERE user_id = ?',
            [req.user.id]
        );

        if (updatedProfile.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Updated profile not found'
            });
        }

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                first_name: updatedProfile[0].first_name,
                last_name: updatedProfile[0].last_name,
                designation: updatedProfile[0].designation,
                work_experience: updatedProfile[0].work_experience,
                current_organization: updatedProfile[0].current_organization,
                location: updatedProfile[0].location,
                expertise: updatedProfile[0].expertise,
                areas_of_help: updatedProfile[0].areas_of_help,
                phone_number: updatedProfile[0].phone_number,
                video_pricing: updatedProfile[0].video_pricing,
                audio_pricing: updatedProfile[0].audio_pricing,
                chat_pricing: updatedProfile[0].chat_pricing,
                linkedin: updatedProfile[0].linkedin_url,
                twitter: updatedProfile[0].twitter_url,
                instagram: updatedProfile[0].instagram_url
            }
        });
    } catch (error) {
        console.error('Error updating expert profile:', error);
        
        // Handle specific database errors
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user reference'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating expert profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
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

// Update expert profile sections
router.put('/profile/:user_id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { user_id } = req.params;
    const { section, ...updates } = req.body;

    // Debug log
    console.log('Received update request:', {
      user_id,
      section,
      updates
    });

    // Validate token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify token
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Validate section
    if (!['personal', 'contact', 'pricing'].includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update section'
      });
    }

    // Build query based on section
    let query = '';
    let params = [];

    switch(section) {
      case 'personal':
        query = `
          UPDATE expert_profiles 
          SET first_name = ?, 
              last_name = ?, 
              designation = ?
          WHERE user_id = ?
        `;
        params = [
          updates.first_name,
          updates.last_name,
          updates.designation,
          user_id
        ];
        break;

      case 'contact':
        query = `
          UPDATE expert_profiles 
          SET current_organization = ?, 
              location = ?, 
              work_experience = ?,
              phone_number = ?
          WHERE user_id = ?
        `;
        params = [
          updates.current_organization,
          updates.location,
          updates.work_experience,
          updates.phone_number,
          user_id
        ];
        break;

      case 'pricing':
        query = `
          UPDATE expert_profiles 
          SET video_pricing = ?, 
              audio_pricing = ?, 
              chat_pricing = ?
          WHERE user_id = ?
        `;
        params = [
          updates.video_pricing ? parseFloat(updates.video_pricing) : null,
          updates.audio_pricing ? parseFloat(updates.audio_pricing) : null,
          updates.chat_pricing ? parseFloat(updates.chat_pricing) : null,
          user_id
        ];
        break;
    }

    // Execute update
    const [result] = await connection.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    // Fetch updated profile
    const [profiles] = await connection.execute(
      `SELECT * FROM expert_profiles WHERE user_id = ?`,
      [user_id]
    );

    // Debug log
    console.log('Update successful, returning profile:', profiles[0]);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profiles[0]
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Add this new route for fetching profile by user_id
router.get('/profile/:user_id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { user_id } = req.params;

    // Debug log
    console.log('Fetching profile for user:', user_id);

    const [profiles] = await connection.execute(
      `SELECT ep.*, u.email 
       FROM expert_profiles ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.user_id = ?`,
      [user_id]
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
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

// Fetch expert profile by user_id
router.get('/profile/:user_id', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const { user_id } = req.params;

    // Debug log to verify the user_id
    console.log('Fetching profile for user_id:', user_id);

    // Fetch expert profile with user data
    const [profiles] = await connection.execute(
      `SELECT * FROM expert_profiles WHERE user_id = ?`,
      [user_id]
    );

    if (profiles.length === 0) {
      console.log('No profile found for user_id:', user_id);
      return res.status(404).json({
        success: false,
        message: 'Expert profile not found'
      });
    }

    console.log('Profile found:', profiles[0]);
    res.json({
      success: true,
      data: profiles[0]
    });
  } catch (error) {
    console.error('Error fetching expert profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expert profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;