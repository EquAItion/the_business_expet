const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../server');  // Import pool from server.js

// Register user (expert or solution seeker)
router.post('/register', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { name, email, password, role } = req.body;

        // Validate input
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (!['expert', 'solution_seeker'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const userId = uuidv4();
        await connection.execute(
            'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [userId, name, email, hashedPassword, role]
        );

        // Generate JWT token
        const token = jwt.sign(
            { id: userId, role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Store token in database
        const tokenId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await connection.execute(
            'INSERT INTO auth_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [tokenId, userId, token, expiresAt]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: userId,
                name,
                email,
                role,
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Login user
router.post('/login', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { email, password } = req.body;

        const [users] = await connection.execute(
            `SELECT 
                u.id as user_id, 
                u.name, 
                u.email, 
                u.password, 
                u.role
            FROM users u
            WHERE u.email = ? AND u.role = 'expert'`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        delete user.password;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                ...user,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in'
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

module.exports = router;