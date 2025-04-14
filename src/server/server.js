const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'expertise_station',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Add this line after creating the pool:
app.locals.db = pool;

// Test database connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully');

        // Create database if not exists
        await connection.query('CREATE DATABASE IF NOT EXISTS expertise_station');
        await connection.query('USE expertise_station');

        // Create webinar_registrations table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS webinar_registrations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                profession VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                phone VARCHAR(20) NOT NULL,
                area_of_interest VARCHAR(255) NOT NULL,
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Add this in your testConnection function after other CREATE TABLE statements
        await connection.query(`
            CREATE TABLE IF NOT EXISTS seeker_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                industry VARCHAR(100) NOT NULL,
                company VARCHAR(100) NOT NULL,
                position VARCHAR(100) NOT NULL,
                experience VARCHAR(50) NOT NULL,
                location VARCHAR(100) NOT NULL,
                bio TEXT NOT NULL,
                interests VARCHAR(255) NOT NULL,
                linkedin_url VARCHAR(255),
                website_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Make sure the users table has a profile_completed column
        await connection.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE
        `);

        connection.release();
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

// Initialize database
testConnection();

// Export pool before routes to avoid circular dependency
module.exports = { pool };

// After creating the pool
app.locals.db = pool;

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/experts', require('./routes/experts'));
app.use('/api/webinar', require('./routes/webinar'));
app.use('/api/business-plans', require('./routes/businessPlans'));

const profilesRouter = require('./routes/profiles');
const expertAvailabilityRoutes = require('./routes/ExpertAvailability');

// Pass the database connection to the routes
app.use('/api/profiles', profilesRouter);
app.use('/api/experts', expertAvailabilityRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});