const express = require('express');
const router = express.Router();
const pool = require('../database');
const admin = require('firebase-admin');

// Get notifications for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('Fetching notifications for user:', userId);
  
  try {
    const pool = req.app.locals.db;
    
    // Check if read_status column exists
    const [columns] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'expertise_station' AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'read_status'"
    );
    
    if (columns.length === 0) {
      console.log('Adding read_status column to notifications table');
      await pool.query(
        "ALTER TABLE notifications ADD COLUMN read_status BOOLEAN DEFAULT FALSE"
      );
    }

    // Check if status_color column exists
    const [colorColumns] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'expertise_station' AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'status_color'"
    );

    if (colorColumns.length === 0) {
      console.log('Adding status_color column to notifications table');
      await pool.query(
        "ALTER TABLE notifications ADD COLUMN status_color VARCHAR(20) DEFAULT 'default'"
      );
    }

    // Check if type column needs update (enum values)
    const [typeColumns] = await pool.query(
      "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'expertise_station' AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'type'"
    );

    if (typeColumns.length > 0) {
      const typeColumn = typeColumns[0];
      const currentTypes = typeColumn.COLUMN_TYPE.replace(/^enum\(|\)$/g, '').split(',').map(t => t.replace(/^'|'$/g, ''));
      const newTypes = [
        'booking',
        'booking_status',
        'booking_reschedule',
        'session_reminder',
        'message',
        'session_accepted',
        'session_rejected',
        'session_cancelled',
        'session_rescheduled'
      ];

      const missingTypes = newTypes.filter(t => !currentTypes.includes(t));
      if (missingTypes.length > 0) {
        console.log('Updating notification types to include:', missingTypes);
        await pool.query(
          `ALTER TABLE notifications MODIFY COLUMN type ENUM(${newTypes.map(t => `'${t}'`).join(',')}) NOT NULL`
        );
      }
    }
    
    // Fetch notifications
    const [notifications] = await pool.query(
      `SELECT id, type, message, related_id, 
              COALESCE(read_status, FALSE) as read_status, 
              COALESCE(status_color, 'default') as status_color,
              created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    console.log(`Found ${notifications.length} notifications for user ${userId}`);
    res.json({ success: true, data: notifications });
    
  } catch (error) {
    console.error('Error in notifications endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications',
      error: error.message 
    });
  }
});

// Mark notification as read (single)
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = req.app.locals.db;
    await pool.query('UPDATE notifications SET read_status = TRUE WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read for a user
router.put('/:userId/read-all', async (req, res) => {
  const { userId } = req.params;
  try {
    const pool = req.app.locals.db;
    await pool.query('UPDATE notifications SET read_status = TRUE WHERE user_id = ? AND read_status = FALSE', [userId]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
});

// Create a new notification
router.post('/', async (req, res) => {
  const { user_id, type, message, related_id, user_role } = req.body;
  if (!user_id || !type || !message || !user_role) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const pool = req.app.locals.db;
    
    // First get the user's notification token
    const [tokens] = await pool.query(
      'SELECT token FROM notification_tokens WHERE user_id = ?',
      [user_id]
    );

    // Insert notification into database
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, message, related_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [user_id, type, message, related_id || null]
    );

    // If we have a token, send push notification
    if (tokens.length > 0) {
      const notification = {
        notification: {
          title: getNotificationTitle(type),
          body: message,
        },
        data: {
          type,
          related_id: related_id || '',
          user_role,
          click_action: '/appointments', // This will be overridden by the service worker based on user_role
          tag: type, // Group notifications by type
        },
        token: tokens[0].token
      };

      try {
        const response = await admin.messaging().send(notification);
        console.log('Successfully sent notification:', response);
      } catch (error) {
        console.error('Error sending notification:', error);
        // Don't fail the request if notification sending fails
      }
    }

    res.json({ 
      success: true, 
      notificationId: result.insertId,
      notificationSent: tokens.length > 0
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
});

// Helper function to get notification title based on type
function getNotificationTitle(type) {
  const titles = {
    'booking': 'New Booking Request',
    'booking_status': 'Booking Status Update',
    'booking_reschedule': 'Booking Rescheduled',
    'session_reminder': 'Session Reminder',
    'message': 'New Message',
    'session_accepted': 'Session Accepted',
    'session_rejected': 'Session Rejected',
    'session_cancelled': 'Session Cancelled',
    'session_rescheduled': 'Session Rescheduled'
  };
  return titles[type] || 'New Notification';
}

// Store notification token
router.post('/users/:userId/notification-token', async (req, res) => {
  const { userId } = req.params;
  const { token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: userId and token are required'
    });
  }

  try {
    // First check if user exists
    const [userCheck] = await pool.query(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Insert or update token
    await pool.query(
      `INSERT INTO notification_tokens (user_id, token) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE token = ?, updated_at = CURRENT_TIMESTAMP`,
      [userId, token, token]
    );

    res.json({ 
      success: true, 
      message: 'Notification token updated successfully' 
    });
  } catch (error) {
    console.error('Error updating notification token:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update notification token' 
    });
  }
});

module.exports = router;
