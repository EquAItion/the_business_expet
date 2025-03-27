require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/experts', require('./routes/experts'));
app.use('/api/webinar', require('./routes/webinar'));

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
    console.log(`Server is running on port ${PORT}`);
});

// Export pool for use in other files
module.exports = { pool };