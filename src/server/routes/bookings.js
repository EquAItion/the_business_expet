
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Helper function to extract seeker_id from JWT token in Authorization header
function getSeekerIdFromToken(req) {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Authorization header:', authHeader);
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1]; // "Bearer <token>"
    console.log('Token extracted:', token);
    if (!token) return null;

    const secret = process.env.JWT_SECRET || 'your_jwt_secret'; // JWT secret key
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      console.log('Decoded token:', decoded);
    } catch (verifyError) {
      console.error('JWT verification error:', verifyError);
      return null;
    }

    return decoded.user_id; // adjust if your JWT payload uses another key for user ID
  } catch (err) {
    console.error('Error in getSeekerIdFromToken:', err);
    return null;
  }
}

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const [bookings] = await pool.query(
      `SELECT * FROM bookings ORDER BY created_at DESC`
    );
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// Get bookings for an expert
router.get('/expert/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    const [bookings] = await pool.query(
      `SELECT b.id, b.expert_id, b.seeker_id, u.name AS seeker_name, b.appointment_date AS date,
              b.start_time, b.end_time, b.session_type, b.status, b.amount, b.created_at
       FROM bookings b
       JOIN users u ON b.seeker_id = u.id
       WHERE b.expert_id = ?
       ORDER BY b.created_at DESC`,
      [id]
    );
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching expert bookings:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch expert bookings' });
  }
});

// ✅ Upcoming confirmed bookings for an expert
router.get('/upcoming/:expert_id', async (req, res) => {
  try {
    const { expert_id } = req.params;
    const pool = req.app.locals.db;

    const [results] = await pool.query(
      `SELECT * FROM bookings 
       WHERE expert_id = ? 
         AND status = 'confirmed' 
         AND appointment_date >= CURDATE()
       ORDER BY appointment_date ASC, start_time ASC`,
      [expert_id]
    );

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching upcoming bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming bookings' });
  }
});

// Get bookings for a seeker
router.get('/seeker/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching bookings for seeker ID: ${id}`);
    
    const pool = req.app.locals.db;
    
    // First check if the seeker exists
    const [seekerCheck] = await pool.query(
      `SELECT id FROM users WHERE id = ?`,
      [id]
    );
    
    if (seekerCheck.length === 0) {
      console.log(`Seeker with ID ${id} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Seeker not found' 
      });
    }
    
    const [bookings] = await pool.query(
      `SELECT b.id, b.expert_id, u.name AS expert_name, b.seeker_id, 
              b.appointment_date AS date, b.start_time, b.end_time, 
              b.session_type, b.status, b.amount, b.created_at, 
              b.notes
       FROM bookings b
       JOIN users u ON b.expert_id = u.id
       WHERE b.seeker_id = ?
       ORDER BY b.created_at DESC`,
      [id]
    );
    
    console.log(`Found ${bookings.length} bookings for seeker ${id}`);
    
    // Add detailed logging for each booking
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, {
        id: booking.id,
        expert_id: booking.expert_id,
        expert_name: booking.expert_name,
        date: booking.date,
        status: booking.status
      });
    });
    
    res.json({ 
      success: true, 
      data: bookings 
    });
  } catch (error) {
    console.error('Error fetching seeker bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch seeker bookings' 
    });
  }
});

// Create a new booking
router.post('/', async (req, res) => {
  try {
    // Get seeker_id from token or request body
    let seeker_id = getSeekerIdFromToken(req);
    if (!seeker_id && req.body.seeker_id) {
      seeker_id = req.body.seeker_id;
    }
    
    if (!seeker_id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or missing token' });
    }

    const { expert_id, date, start_time, end_time, session_type, amount } = req.body;

    if (!expert_id || !date || !start_time || !end_time || !session_type) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const bookingId = uuidv4();
    const pool = req.app.locals.db;

    // Get seeker name for notification
    const [seekerResult] = await pool.query(
      'SELECT name FROM users WHERE id = ?',
      [seeker_id]
    );
    const seekerName = seekerResult.length > 0 ? seekerResult[0].name : 'A seeker';

    // Get expert name for the booking record
    const [expertResult] = await pool.query(
      'SELECT name FROM users WHERE id = ?',
      [expert_id]
    );
    const expertName = expertResult.length > 0 ? expertResult[0].name : 'Expert';

    console.log(`Creating booking: seeker=${seeker_id} (${seekerName}), expert=${expert_id} (${expertName})`);

    // Insert booking with all required fields
    await pool.query(
      `INSERT INTO bookings (id, expert_id, seeker_id, appointment_date, start_time, end_time,
        session_type, status, amount, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [bookingId, expert_id, seeker_id, date, start_time, end_time, session_type, amount || 0]
    );

    console.log(`Booking created successfully: ID=${bookingId}`);

    // Create notification for expert
    await pool.query(
      `INSERT INTO notifications 
       (user_id, type, message, related_id, created_at) 
       VALUES (?, 'booking', ?, ?, NOW())`,
      [
        expert_id,
        `${seekerName} has booked a session with you on ${date} at ${start_time}`,
        bookingId
      ]
    );

    // Create notification for seeker too
    await pool.query(
      `INSERT INTO notifications 
       (user_id, type, message, related_id, created_at) 
       VALUES (?, 'booking', ?, ?, NOW())`,
      [
        seeker_id,
        `You have booked a session with ${expertName} on ${date} at ${start_time}`,
        bookingId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: bookingId,
        expert_id,
        expert_name: expertName,
        seeker_id,
        seeker_name: seekerName,
        date,
        start_time,
        end_time,
        session_type,
        status: 'pending',
        amount: amount || 0,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// Update booking status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const pool = req.app.locals.db;
    await pool.query(
      `UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        id,
        status,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status' });
  }
});

module.exports = router;
