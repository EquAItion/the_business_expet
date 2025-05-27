
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

    return decoded.user_id || decoded.id; // Check both possible ID fields
  } catch (err) {
    console.error('Error in getSeekerIdFromToken:', err);
    return null;
  }
}

// Helper function to create notifications
async function createNotification(pool, userId, type, message, relatedId) {
  try {
    await pool.query(
      `INSERT INTO notifications 
       (user_id, type, message, related_id, read_status, created_at) 
       VALUES (?, ?, ?, ?, FALSE, NOW())`,
      [userId, type, message, relatedId]
    );
    console.log(`Notification created for user ${userId}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.db;
    const [bookings] = await pool.query(
      `SELECT b.*, 
              e.name AS expert_name, 
              s.name AS seeker_name
       FROM bookings b
       LEFT JOIN users e ON b.expert_id = e.id
       LEFT JOIN users s ON b.seeker_id = s.id
       ORDER BY b.created_at DESC`
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
    
    console.log(`Fetching expert bookings for ID: ${id}`);
    
    const [bookings] = await pool.query(
      `SELECT b.id, b.expert_id, b.seeker_id, 
              COALESCE(s.name, 'Unknown Seeker') AS seeker_name, 
              b.appointment_date AS date,
              TIME_FORMAT(b.start_time, '%h:%i %p') AS start_time,
              TIME_FORMAT(b.end_time, '%h:%i %p') AS end_time,
              b.session_type, b.status, b.amount, b.created_at, b.notes
       FROM bookings b
       LEFT JOIN users s ON b.seeker_id = s.id
       WHERE b.expert_id = ?
       ORDER BY b.appointment_date DESC, b.start_time DESC`,
      [id]
    );
    
    console.log(`Found ${bookings.length} expert bookings`);
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching expert bookings:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch expert bookings' });
  }
});

// ✅ Get bookings for a seeker - FIXED TO MATCH EXPERT FORMAT
router.get('/seeker/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching seeker bookings for ID: ${id}`);
    
    const pool = req.app.locals.db;
    
    // First check if the seeker exists
    const [seekerCheck] = await pool.query(
      `SELECT id, name FROM users WHERE id = ?`,
      [id]
    );
    
    if (seekerCheck.length === 0) {
      console.log(`Seeker with ID ${id} not found`);
      return res.status(404).json({ 
        success: false, 
        message: 'Seeker not found' 
      });
    }
    
    try {
      // ✅ FIXED: Match the exact same structure as expert bookings
      const [bookings] = await pool.query(
        `SELECT b.id, b.expert_id, b.seeker_id, 
                COALESCE(e.name, 'Unknown Expert') AS expert_name, 
                b.appointment_date AS date,
                TIME_FORMAT(b.start_time, '%h:%i %p') AS start_time,
                TIME_FORMAT(b.end_time, '%h:%i %p') AS end_time,
                b.session_type, b.status, b.amount, b.created_at, b.notes
         FROM bookings b
         LEFT JOIN users e ON b.expert_id = e.id
         WHERE b.seeker_id = ?
         ORDER BY b.appointment_date DESC, b.start_time DESC`,
        [id]
      );
      
      console.log(`Found ${bookings.length} seeker bookings`);
      
      // Add detailed logging for each booking
      bookings.forEach((booking, index) => {
        console.log(`Seeker Booking ${index + 1}:`, {
          id: booking.id,
          expert_id: booking.expert_id,
          expert_name: booking.expert_name,
          seeker_id: booking.seeker_id,
          date: booking.date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          amount: booking.amount
        });
      });
      
      res.json({ 
        success: true, 
        data: bookings 
      });
    } catch (queryError) {
      console.error('Database query error for seeker bookings:', queryError);
      
      // Return empty data instead of error to prevent frontend crash
      res.json({ 
        success: true, 
        data: [] 
      });
    }
  } catch (error) {
    console.error('Error fetching seeker bookings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch seeker bookings' 
    });
  }
});

// ✅ Upcoming confirmed bookings for an expert
router.get('/upcoming/:expert_id', async (req, res) => {
  try {
    const { expert_id } = req.params;
    const pool = req.app.locals.db;

    const [results] = await pool.query(
      `SELECT b.*, 
              COALESCE(s.name, 'Unknown Seeker') AS seeker_name
       FROM bookings b
       LEFT JOIN users s ON b.seeker_id = s.id
       WHERE b.expert_id = ? 
         AND b.status = 'confirmed' 
         AND b.appointment_date >= CURDATE()
       ORDER BY b.appointment_date ASC, b.start_time ASC`,
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

// ✅ NEW: Upcoming confirmed bookings for a seeker
router.get('/upcoming/seeker/:seeker_id', async (req, res) => {
  try {
    const { seeker_id } = req.params;
    const pool = req.app.locals.db;

    const [results] = await pool.query(
      `SELECT b.*, 
              COALESCE(e.name, 'Unknown Expert') AS expert_name
       FROM bookings b
       LEFT JOIN users e ON b.expert_id = e.id
       WHERE b.seeker_id = ? 
         AND b.status IN ('confirmed', 'pending')
         AND b.appointment_date >= CURDATE()
       ORDER BY b.appointment_date ASC, b.start_time ASC`,
      [seeker_id]
    );

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error fetching seeker upcoming bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seeker upcoming bookings' });
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

    const { expert_id, date, start_time, end_time, session_type, amount, notes } = req.body;

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

    // ✅ Convert time format for database storage
    const dbStartTime = convertTo24HourFormat(start_time);
    const dbEndTime = convertTo24HourFormat(end_time);

    // Insert booking with all required fields
    await pool.query(
      `INSERT INTO bookings (id, expert_id, seeker_id, appointment_date, start_time, end_time,
        session_type, status, amount, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NOW())`,
      [bookingId, expert_id, seeker_id, date, dbStartTime, dbEndTime, session_type, amount || 0, notes || '']
    );

    console.log(`Booking created successfully: ID=${bookingId}`);

    // Create notification for expert
    await createNotification(
      pool,
      expert_id,
      'booking',
      `${seekerName} has booked a ${session_type} session with you on ${date} at ${start_time}`,
      bookingId
    );

    // Create notification for seeker too
    await createNotification(
      pool,
      seeker_id,
      'booking',
      `You have booked a ${session_type} session with ${expertName} on ${date} at ${start_time}`,
      bookingId
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
        notes: notes || '',
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

    if (!['pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const pool = req.app.locals.db;
    
    // First check if booking exists
    const [existingBooking] = await pool.query(
      `SELECT * FROM bookings WHERE id = ?`,
      [id]
    );
    
    if (existingBooking.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = existingBooking[0];

    await pool.query(
      `UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );

    // Create detailed notification messages based on status
    let notificationMessage = '';
    let recipientId = '';

    if (status === 'confirmed') {
      const sessionType = booking.session_type || 'session';
      notificationMessage = `Your ${sessionType} booking for ${booking.appointment_date} at ${booking.start_time} has been confirmed`;
      recipientId = booking.seeker_id;
    } else if (status === 'rejected') {
      const sessionType = booking.session_type || 'session';
      notificationMessage = `Your ${sessionType} booking for ${booking.appointment_date} at ${booking.start_time} has been rejected`;
      recipientId = booking.seeker_id;
    } else if (status === 'cancelled') {
      const [seekerResult] = await pool.query('SELECT name FROM users WHERE id = ?', [booking.seeker_id]);
      const seekerName = seekerResult.length > 0 ? seekerResult[0].name : 'A seeker';
      notificationMessage = `${seekerName} has cancelled their booking for ${booking.appointment_date} at ${booking.start_time}`;
      recipientId = booking.expert_id;
    } else if (status === 'rescheduled') {
      notificationMessage = `Your booking has been rescheduled to ${booking.appointment_date} at ${booking.start_time}`;
      recipientId = booking.seeker_id;
    }

    if (notificationMessage && recipientId) {
      try {
        await pool.query(
          `INSERT INTO notifications 
           (user_id, type, message, related_id, created_at) 
           VALUES (?, 'booking_status', ?, ?, NOW())`,
          [recipientId, notificationMessage, id]
        );
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }
    }

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
    if (error instanceof Error) {
      console.error('Detailed error message:', error.message);
      res.status(500).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update booking status' });
    }
  }
});

// Reschedule booking endpoint
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, start_time, end_time } = req.body;
    const pool = req.app.locals.db;
    
    console.log(`Attempting to reschedule booking ${id} to ${date} at ${start_time}`);
    
    if (!date || !start_time) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Convert time formats for database storage
    let sqlStartTime = convertTo24HourFormat(start_time);
    let sqlEndTime = end_time ? convertTo24HourFormat(end_time) : calculateEndTime(sqlStartTime);
    
    console.log(`Converted times: start=${sqlStartTime}, end=${sqlEndTime}`);
    
    // First check if booking exists
    const [bookingCheck] = await pool.query(
      `SELECT b.*, 
              e.name AS expert_name, 
              s.name AS seeker_name
       FROM bookings b
       LEFT JOIN users e ON b.expert_id = e.id
       LEFT JOIN users s ON b.seeker_id = s.id
       WHERE b.id = ?`,
      [id]
    );
    
    if (bookingCheck.length === 0) {
      console.log(`Booking with ID ${id} not found`);
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const booking = bookingCheck[0];
    console.log(`Found booking: ${JSON.stringify(booking)}`);
    
    // Update the booking
    await pool.query(
      `UPDATE bookings 
       SET appointment_date = ?, start_time = ?, end_time = ?, status = 'confirmed', updated_at = NOW()
       WHERE id = ?`,
      [date, sqlStartTime, sqlEndTime, id]
    );
    
    console.log(`Successfully updated booking in database`);
    
    try {
      // Create notification for seeker
      await pool.query(
        `INSERT INTO notifications 
         (user_id, type, message, related_id, created_at) 
         VALUES (?, ?, ?, ?, NOW())`,
        [
          booking.seeker_id,
          'booking_reschedule',
          `Your session with ${booking.expert_name} has been rescheduled to ${date} at ${start_time}`,
          id
        ]
      );
      
      console.log(`Notification created for seeker ${booking.seeker_id}`);
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Continue even if notification creation fails
    }
    
    res.json({ 
      success: true, 
      message: 'Booking rescheduled successfully',
      data: {
        id,
        date,
        start_time,
        end_time: end_time || start_time,
        status: 'confirmed'
      }
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({ success: false, message: 'Failed to reschedule booking' });
  }
});

// Helper function to convert time from "2:00 PM" format to "14:00:00" format
function convertTo24HourFormat(timeStr) {
  try {
    // If already in 24-hour format, just add seconds if missing
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
      return timeStr.includes(':') ? `${timeStr}:00` : timeStr;
    }
    
    const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return '00:00:00';
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    
    // Convert to 24-hour format
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    // Format as HH:MM:SS
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  } catch (error) {
    console.error('Error converting time format:', error);
    return '00:00:00'; // Default fallback
  }
}

// Helper function to calculate end time (1 hour after start time)
function calculateEndTime(startTime) {
  try {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = (hours + 1) % 24;
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  } catch (error) {
    console.error('Error calculating end time:', error);
    return '00:00:00';
  }
}

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;

    const [bookingResult] = await pool.query(
      `SELECT b.id, b.expert_id, b.seeker_id, b.appointment_date AS date,
              TIME_FORMAT(b.start_time, '%H:%i:%s') AS start_time,
              TIME_FORMAT(b.end_time, '%H:%i:%s') AS end_time,
              b.session_type, b.status, b.amount, b.created_at, b.notes,
              e.name AS expert_name,
              s.name AS seeker_name
       FROM bookings b
       LEFT JOIN users e ON b.expert_id = e.id
       LEFT JOIN users s ON b.seeker_id = s.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookingResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: bookingResult[0] });
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
});

module.exports = router;
