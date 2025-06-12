

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const notificationsRouter = require('./routes/notifications');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env' });
} else {
  dotenv.config();
}  

const app = express();

console.log('JWT_SECRET environment variable:', process.env.JWT_SECRET);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    if(!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:3000',
      'https://localhost:5173',
      'http://192.168.1.8:5173',
      'http://localhost:5174',
      'https://localhost:5174',
      'http://192.168.1.8:5174',
      'http://192.168.0.118:5173',
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

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'expert',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.locals.db = pool;

// Test database connection and create tables if needed
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');


    connection.release();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

testConnection();

// Export pool before routes to avoid circular dependency
module.exports = { pool };

app.locals.db = pool;

// Routes
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
const functionalitiesRouter = require('./routes/functionalities');
const sessionFeedbackRouter = require('./routes/sessionFeedback');

app.use('/api/profiles', profilesRouter);
app.use('/api/experts', expertAvailabilityRoutes);
app.use('/api/bookings', bookingsRouter);
app.use('/api/agora', agoraTokenRouter);
app.use('/api/users', usersRouter);
app.use('/api/functionalities', functionalitiesRouter);
app.use('/api/session-feedback', sessionFeedbackRouter);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
