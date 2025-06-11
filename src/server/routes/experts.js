const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { pool } = require('../server');
const authenticateToken = require('../middleware/auth');
   
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
    let connection;
    try {
        connection = await pool.getConnection();
        
        // Generate profile ID
        const profileId = uuidv4();

        // Destructure and validate required fields
        const {
            user_id,
            first_name,
            last_name,
            designation,
            date_of_birth,
            phone_number,
            work_experience,
            current_organization,
            location,
            expertise,
            areas_of_help,
            audio_pricing,
            linkedin_url
        } = req.body;

        // Validate required fields
        if (!user_id || !first_name || !last_name || !designation || !date_of_birth || 
            !phone_number || !current_organization || !location || !expertise || !areas_of_help) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const query = `
            INSERT INTO expert_profiles (
                id,
                user_id,
                first_name,
                last_name,
                designation,
                date_of_birth,
                phone_number,
                work_experience,
                current_organization,
                location,
                expertise,
                areas_of_help,
                audio_pricing,
                linkedin_url,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

        const params = [
            profileId,
            user_id,
            first_name,
            last_name,
            designation,
            date_of_birth,
            phone_number,
            work_experience || 0,
            current_organization,
            location,
            expertise,
            areas_of_help,
            audio_pricing || 0,
            linkedin_url || null
        ];

        // Log parameters for debugging
        console.log('Query parameters:', params);

        await connection.execute(query, params);

        // Update user profile completion status
        await connection.execute(
            'UPDATE users SET profile_completed = 1 WHERE id = ?',
            [user_id]
        );

        res.status(201).json({
            success: true,
            message: 'Expert profile created successfully'
        });

    } catch (error) {
        console.error('Error creating expert profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create expert profile',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
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
    const { section, data } = req.body;

    // Debug log
    console.log('Received update request:', { user_id, section, data });

    // Validate input
    if (!section || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: section and data'
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
          SET first_name = COALESCE(?, first_name), 
              last_name = COALESCE(?, last_name), 
              designation = COALESCE(?, designation),
              expertise = COALESCE(?, expertise),
              areas_of_help = COALESCE(?, areas_of_help)
          WHERE user_id = ?
        `;
        params = [
          data.first_name ?? null,
          data.last_name ?? null,
          data.designation ?? null,
          data.expertise ?? null,
          data.areas_of_help ?? null,
          user_id
        ];
        break;

      case 'contact':
        query = `
          UPDATE expert_profiles 
          SET current_organization = COALESCE(?, current_organization), 
              location = COALESCE(?, location), 
              work_experience = COALESCE(?, work_experience),
              phone_number = COALESCE(?, phone_number)
          WHERE user_id = ?
        `;
        params = [
          data.current_organization ?? null,
          data.location ?? null,
          data.work_experience ? parseInt(data.work_experience, 10) : null,
          data.phone_number ?? null,
          user_id
        ];
        break;

      case 'pricing':
        query = `
          UPDATE expert_profiles 
          SET video_pricing = COALESCE(?, video_pricing), 
              audio_pricing = COALESCE(?, audio_pricing), 
              chat_pricing = COALESCE(?, chat_pricing)
          WHERE user_id = ?
        `;
        params = [
          data.video_pricing ? parseFloat(data.video_pricing) : null,
          data.audio_pricing ? parseFloat(data.audio_pricing) : null,
          data.chat_pricing ? parseFloat(data.chat_pricing) : null,
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

    if (!profiles[0]) {
      throw new Error('Failed to fetch updated profile');
    }

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
      error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
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

// Protected route - requires authentication
router.get('/availability/:userId', authenticateToken, async (req, res) => {
  let connection;
  try {
    connection = await req.app.locals.db.getConnection();
    
    const [availability] = await connection.execute(
      `SELECT * FROM expert_availability WHERE user_id = ? ORDER BY day_of_week, start_time`,
      [req.params.userId]
    );

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching availability data'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;