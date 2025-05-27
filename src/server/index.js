const express = require('express');
const notificationsRoutes = require('./routes/notifications');
const agoraRoutes = require('./routes/agora');
const bookingsRoutes = require('./routes/bookings');

const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Add a test route to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Parse JSON request body
app.use(express.json());

app.use('/api/notifications', notificationsRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/bookings', bookingsRoutes);

// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

