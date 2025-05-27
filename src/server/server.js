const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const notificationsRouter = require('./routes/notifications');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config();
}  



const app = express();

console.log('JWT_SECRET environment variable:', process.env.JWT_SECRET);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:3000',
      'https://localhost:5173',
      'http://192.168.1.8:5173',
      'https://expertisestation.com'
    ];
    
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add a simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});



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
        const [rows] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'profile_completed'
        `);
        if (rows.length === 0) {
            await connection.query(`
                ALTER TABLE users ADD COLUMN profile_completed BOOLEAN DEFAULT FALSE
            `);
        }

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
// Existing route registrations
app.use('/api/auth', require('./routes/auth'));
app.use('/api/experts', require('./routes/experts'));
app.use('/api/webinar', require('./routes/webinar'));
app.use('/api/business-plans', require('./routes/businessPlans'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/notifications', notificationsRouter);

const profilesRouter = require('./routes/profiles');
const expertAvailabilityRoutes = require('./routes/ExpertAvailability');
const bookingsRouter = require('./routes/bookings');
const agoraTokenRouter = require('./routes/agora');
const usersRouter = require('./routes/users');

// Pass the database connection to the routes
app.use('/api/profiles', profilesRouter);
app.use('/api/experts', expertAvailabilityRoutes);
app.use('/api/bookings', bookingsRouter);
app.use('/api/agora', agoraTokenRouter);
app.use('/api/users', usersRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});







