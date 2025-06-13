const express = require('express');
const router = express.Router();
const { pool } = require('../server');
const authenticateToken = require('../middleware/auth');

// Submit session feedback
router.post('/', authenticateToken, async (req, res) => {
  let connection;
  try {
    // Log the complete request
    console.log('=== FEEDBACK SUBMISSION REQUEST START ===');
    console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('User Data:', JSON.stringify(req.user, null, 2));
    console.log('=== REQUEST DETAILS END ===');

    // Validate user data
    if (!req.user || !req.user.user_id) {
      console.error('Invalid user data:', req.user);
      return res.status(401).json({
        success: false,
        message: 'Invalid user authentication'
      });
    }

    // Get connection from pool
    try {
      connection = await pool.getConnection();
      console.log('Database connection successful');
    } catch (connError) {
      console.error('Database connection error:', connError);
      throw new Error('Failed to connect to database');
    }

    // Extract and validate data
    const { booking_id, rating, review, message } = req.body;
    const user_id = req.user.user_id;
    const user_role = req.user.role === 'solution_seeker' ? 'seeker' : req.user.role;

    console.log('=== EXTRACTED DATA ===');
    console.log({
      booking_id,
      user_id,
      user_role,
      original_role: req.user.role,
      rating,
      review,
      message
    });

    // Validate booking_id
    if (!booking_id) {
      console.error('Missing booking_id');
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Validate rating for seekers
    if ((user_role === 'seeker' || req.user.role === 'solution_seeker') && !rating) {
      console.error('Missing rating for seeker');
      return res.status(400).json({
        success: false,
        message: 'Rating is required for seekers'
      });
    }

    // Start transaction
    try {
      await connection.beginTransaction();
      console.log('Transaction started');

      // First, verify the booking exists
      console.log('Verifying booking:', booking_id);
      const [bookings] = await connection.query(
        'SELECT * FROM bookings WHERE id = ?',
        [booking_id]
      );
      console.log('Booking query result:', bookings);

      if (bookings.length === 0) {
        console.error('Booking not found:', booking_id);
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Verify user is part of the booking
      const booking = bookings[0];
      if (booking.expert_id !== user_id && booking.seeker_id !== user_id) {
        console.error('User not authorized for booking:', {
          user_id,
          booking_expert_id: booking.expert_id,
          booking_seeker_id: booking.seeker_id
        });
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to provide feedback for this session'
        });
      }

      // Check for existing feedback
      console.log('Checking for existing feedback');
      const [existingFeedback] = await connection.query(
        'SELECT id FROM session_feedback WHERE booking_id = ? AND user_id = ?',
        [booking_id, user_id]
      );
      console.log('Existing feedback check:', existingFeedback);

      if (existingFeedback.length > 0) {
        console.error('Feedback already exists');
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Feedback already submitted for this session'
        });
      }

      // Prepare feedback data
      const feedbackData = {
        booking_id,
        user_id,
        user_role,
        rating: rating || null,
        review: review || null,
        message: message || null
      };
      console.log('Inserting feedback with data:', feedbackData);

      // Insert feedback
      const [result] = await connection.query(
        `INSERT INTO session_feedback (
          booking_id, user_id, user_role, rating, review, message
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [feedbackData.booking_id, feedbackData.user_id, feedbackData.user_role, 
         feedbackData.rating, feedbackData.review, feedbackData.message]
      );
      console.log('Insert result:', result);

      // Commit transaction
      await connection.commit();
      console.log('Transaction committed successfully');

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: result.insertId
      });

    } catch (error) {
      console.error('=== TRANSACTION ERROR ===');
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        sql: error.sql
      });
      
      if (connection) {
        try {
          await connection.rollback();
          console.log('Transaction rolled back');
        } catch (rollbackError) {
          console.error('Rollback error:', rollbackError);
        }
      }
      throw error;
    }

  } catch (error) {
    console.error('=== FATAL ERROR ===');
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      sql: error.sql,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.release();
        console.log('Database connection released');
      } catch (err) {
        console.error('Error releasing connection:', err);
      }
    }
    console.log('=== FEEDBACK SUBMISSION REQUEST END ===\n');
  }
});

// Get feedback for an expert
router.get('/expert/:expertId', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { expertId } = req.params;
    
    // Get connection from pool
    connection = await pool.getConnection();

    // Fetch feedback from database
    const [feedbacks] = await connection.query(
      `SELECT sf.*, u.name as seeker_name
       FROM session_feedback sf
       JOIN bookings b ON sf.booking_id = b.id
       JOIN users u ON b.seeker_id = u.id
       WHERE b.expert_id = ? AND sf.user_role = 'seeker'
       ORDER BY sf.created_at DESC`,
      [expertId]
    );

    res.json({
      success: true,
      feedbacks: feedbacks
    });

  } catch (error) {
    console.error('Error fetching expert feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedbacks'
    });
  } finally {
    if (connection) connection.release();
  }
});

// Get feedback for a specific booking
router.get('/booking/:bookingId', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { bookingId } = req.params;
    const userId = req.user.user_id;
    
    console.log('Fetching feedback for booking:', {
      bookingId,
      userId,
      userRole: req.user.role
    });

    connection = await pool.getConnection();

    // Get the booking details first to verify user's access
    const [bookings] = await connection.query(
      'SELECT * FROM bookings WHERE id = ?',
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];
    
    // Verify user is either the expert or seeker of this booking
    if (booking.expert_id !== userId && booking.seeker_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this feedback'
      });
    }

    // Get all feedback for this booking
    const [feedbacks] = await connection.query(
      `SELECT sf.*, 
        CASE 
          WHEN sf.user_role = 'seeker' THEN u.name 
          ELSE e.name 
        END as user_name
       FROM session_feedback sf
       LEFT JOIN users u ON sf.user_id = u.id AND sf.user_role = 'seeker'
       LEFT JOIN users e ON sf.user_id = e.id AND sf.user_role = 'expert'
       WHERE sf.booking_id = ?
       ORDER BY sf.created_at DESC`,
      [bookingId]
    );

    console.log('Found feedbacks:', feedbacks);

    res.json({
      success: true,
      feedbacks: feedbacks,
      booking: {
        id: booking.id,
        expert_id: booking.expert_id,
        seeker_id: booking.seeker_id,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Error fetching booking feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router; 