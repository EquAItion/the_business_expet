// const express = require('express');
// const cors = require('cors');
// const notificationsRoutes = require('./routes/notifications');
// const agoraRoutes = require('./routes/agora');
// const bookingsRoutes = require('./routes/bookings');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Add CORS middleware
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200);
//   }
  
//   next();
// });

// // Add a test route to verify server is working
// app.get('/api/test', (req, res) => {
//   res.json({ message: 'Server is working!' });
// });

// // Mount routers
// app.use('/api/notifications', notificationsRoutes);
// app.use('/api/agora', agoraRoutes);
// app.use('/api/bookings', bookingsRoutes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Error:', err);
//   res.status(500).json({
//     success: false,
//     error: err.message || 'Internal server error'
//   });
// });

// // Start the server
// const PORT = process.env.PORT || 8081;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });





const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const notificationsRoutes = require('./routes/notifications');
const agoraRoutes = require('./routes/agora');
const bookingsRoutes = require('./routes/bookings');

const app = express();

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
      'http://192.168.0.118:5173',
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

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rohitdogra@23',
  database: 'expertise_station',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Add database pool to app.locals
app.locals.db = pool;

// Add a test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Mount routers
app.use('/api/notifications', notificationsRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/bookings', bookingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

