const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../server');  // Import pool from server.js
const { sendEmail } = require('../models/email');  // Import sendEmail

// Add validation helpers
const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

const validateMobileNumber = (number) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(number);
};

const validatePassword = (password) => {
    return password.length >= 8;
};

const validateSeekerFields = (data) => {
    const errors = [];
    
    if (!data.name?.trim()) errors.push('Name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.password?.trim()) errors.push('Password is required');
    if (!data.mobile_number?.trim()) errors.push('Mobile number is required');
    
    if (!validateEmail(data.email)) errors.push('Invalid email format');
    if (!validateMobileNumber(data.mobile_number)) errors.push('Invalid mobile number format');
    if (!validatePassword(data.password)) errors.push('Password must be at least 8 characters');
    
    return errors;
};

// First add expert validation helper
const validateExpertFields = (data) => {
    const errors = [];
    
    if (!data.name?.trim()) errors.push('Name is required');
    if (!data.email?.trim()) errors.push('Email is required');
    if (!data.password?.trim()) errors.push('Password is required');
    if (!data.functionality?.trim()) errors.push('Functionality/Expertise is required');
    
    if (!validateEmail(data.email)) errors.push('Invalid email format');
    if (!validatePassword(data.password)) errors.push('Password must be at least 8 characters');
    
    return errors;
};

// Separate routes for expert and seeker registration
router.post('/register/expert', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { name, email, password, functionality } = req.body;

        // Validate expert fields
        const validationErrors = validateExpertFields({ 
            name, 
            email, 
            password, 
            functionality 
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Check for existing expert
        const [existingUser] = await connection.execute(
            'SELECT id, email FROM users WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await connection.execute(
            `INSERT INTO users (
                id,
                name,
                email,
                password,
                role,
                functionality,
                created_at,
                profile_completed
            ) VALUES (?, ?, ?, ?, 'expert', ?, NOW(), 0)`,
            [
                userId,
                name.trim(),
                email.toLowerCase(),
                hashedPassword,
                functionality
            ]
        );

        const token = jwt.sign(
            { 
                user_id: userId,
                role: 'expert',
                email: email.toLowerCase()
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Expert registration successful',
            data: {
                id: userId,
                name: name.trim(),
                email: email.toLowerCase(),
                role: 'expert',
                token,
                profile_completed: false,
                functionality
            }
        });

    } catch (error) {
        console.error('Expert registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/register/seeker', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { name, email, password, mobile_number } = req.body;

        // Validate seeker fields
        const validationErrors = validateSeekerFields({ 
            name, 
            email, 
            password, 
            mobile_number 
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Check for existing seeker
        const [existingUser] = await connection.execute(
            'SELECT id, email, mobile_number FROM users WHERE email = ? OR mobile_number = ?',
            [email.toLowerCase(), mobile_number]
        );

        if (existingUser.length > 0) {
            const exists = existingUser[0];
            return res.status(409).json({
                success: false,
                message: exists.email.toLowerCase() === email.toLowerCase() 
                    ? 'Email already registered' 
                    : 'Mobile number already registered'
            });
        }

        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await connection.execute(
            `INSERT INTO users (
                id,
                name,
                email,
                password,
                role,
                mobile_number,
                created_at,
                profile_completed
            ) VALUES (?, ?, ?, ?, 'solution_seeker', ?, NOW(), 0)`,  // Removed extra quote
            [
                userId,
                name.trim(),
                email.toLowerCase(),
                hashedPassword,
                mobile_number
            ]
        );

        const token = jwt.sign(
            { 
                user_id: userId,
                role: 'solution_seeker',
                email: email.toLowerCase()
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            success: true,
            message: 'Solution seeker registration successful',
            data: {
                id: userId,
                name: name.trim(),
                email: email.toLowerCase(),
                mobile_number,
                role: 'solution_seeker',
                token,
                profile_completed: false
            }
        });

    } catch (error) {
        console.error('Seeker registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// Expert login
// Update the expert login route to match seeker login response format
router.post('/login/expert', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { email, password } = req.body;

        console.log('Expert login attempt:', { email });

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Query expert with profile status
        const [experts] = await connection.execute(
            `SELECT 
                u.id,
                u.name, 
                u.email, 
                u.password,
                u.role,
                CASE 
                    WHEN ep.user_id IS NOT NULL THEN true 
                    ELSE false 
                END as profile_completed
            FROM users u
            LEFT JOIN expert_profiles ep ON u.id = ep.user_id
            WHERE u.email = ? AND u.role = 'expert'`,
            [email.toLowerCase()]
        );

        if (experts.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid expert credentials'
            });
        }

        const expert = experts[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, expert.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid expert credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                user_id: expert.id,
                role: expert.role,
                email: expert.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from response
        delete expert.password;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                ...expert,
                token
            }
        });

    } catch (error) {
        console.error('Expert login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

// Solution Seeker login
router.post('/login/seeker', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Query solution seeker user
        const [users] = await connection.execute(
            `SELECT 
                u.id as user_id, 
                u.name, 
                u.email, 
                u.password, 
                u.role
            FROM users u
            WHERE u.email = ? AND u.role = 'solution_seeker'`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid solution seeker credentials'
            });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid solution seeker credentials'
            });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Store token in database
        const tokenId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await connection.execute(
            'INSERT INTO auth_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [tokenId, user.user_id, token, expiresAt]
        );

        delete user.password;

        res.json({
            success: true,
            message: 'Solution seeker login successful',
            data: {
                ...user,
                token
            }
        });

    } catch (error) {
        console.error('Solution seeker login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in as solution seeker'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Add this route after your existing routes
router.get('/expert/:user_id', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { user_id } = req.params;

        // Get the token from the request header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        if (decoded.user_id !== user_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Fetch expert profile data
        const [experts] = await connection.execute(
            `SELECT 
                u.id as user_id,
                u.name,
                u.email,
                u.role,
                ep.*
            FROM users u
            LEFT JOIN expert_profiles ep ON u.id = ep.user_id
            WHERE u.id = ? AND u.role = 'expert'`,
            [user_id]
        );

        if (experts.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found'
            });
        }

        // Remove sensitive data
        const expertData = experts[0];
        delete expertData.password;

        res.json({
            success: true,
            message: 'Expert profile retrieved successfully',
            data: expertData
        });

    } catch (error) {
        console.error('Expert profile fetch error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching expert profile'
        });
    } finally {
        if (connection) connection.release();
    }
});

// Modify the seeker profile check route
router.get('/profiles/seeker/:user_id', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { user_id } = req.params;

        // Get the token from the request header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch seeker profile data
        const [seekers] = await connection.execute(
            `SELECT 
                u.id as user_id,
                u.name,
                u.email,
                u.role,
                u.mobile_number,
                CASE 
                    WHEN sp.user_id IS NOT NULL THEN true 
                    ELSE false 
                END as profile_completed
            FROM users u
            LEFT JOIN seeker_profiles sp ON u.id = sp.user_id
            WHERE u.id = ? AND u.role = 'solution_seeker'`,
            [user_id]
        );

        if (seekers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove sensitive data
        const seekerData = seekers[0];
        delete seekerData.password;

        // If no profile exists yet
        if (!seekerData.profile_completed) {
            return res.status(404).json({
                success: false,
                message: 'Profile not completed',
                data: {
                    user_id: seekerData.user_id,
                    profile_completed: false
                }
            });
        }

        res.json({
            success: true,
            message: 'Profile retrieved successfully',
            data: seekerData
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching profile'
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
