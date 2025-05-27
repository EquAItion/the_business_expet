const express = require('express');
const router = express.Router();

// Get notifications for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('Fetching notifications for user:', userId);
  
  try {
    const pool = req.app.locals.db;
    
    // First check if the read_status column exists
    const [columns] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'expertise_station' AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'read_status'"
    );
    
    // If read_status column doesn't exist, add it
    if (columns.length === 0) {
      console.log('Adding read_status column to notifications table');
      await pool.query(
        "ALTER TABLE notifications ADD COLUMN read_status BOOLEAN DEFAULT FALSE"
      );
    }
    
    // Now fetch notifications
    const [notifications] = await pool.query(
      "SELECT id, type, message, related_id, COALESCE(read_status, FALSE) as read_status, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    
    console.log(`Found ${notifications.length} notifications for user ${userId}`);
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
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

// New API to create a notification
router.post('/', async (req, res) => {
  const { user_id, type, message, related_id } = req.body;
  if (!user_id || !type || !message) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  try {
    const pool = req.app.locals.db;
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, type, message, related_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [user_id, type, message, related_id || null]
    );
    res.json({ success: true, notificationId: result.insertId });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create notification' });
  }
});

module.exports = router;
