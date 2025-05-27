const cron = require('node-cron');
const pool = require('./db');
const { format, addMinutes } = require('date-fns');

// Function to create notifications
async function createNotification(userId, type, message, relatedId) {
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

// Schedule job to run every minute to check for upcoming sessions
cron.schedule('* * * * *', async () => {
  try {
    console.log('Running session notification check...');
    
    // Get current time
    const now = new Date();
    
    // Get sessions starting in 5 minutes
    const fiveMinutesLater = addMinutes(now, 5);
    const formattedDate = format(now, 'yyyy-MM-dd');
    const formattedTime = format(now, 'HH:mm:ss');
    const formattedTimePlus5 = format(fiveMinutesLater, 'HH:mm:ss');
    
    // Find bookings that start in 5 minutes
    const [upcomingSessions] = await pool.query(
      `SELECT b.*, 
              e.name AS expert_name, 
              s.name AS seeker_name
       FROM bookings b
       LEFT JOIN users e ON b.expert_id = e.id
       LEFT JOIN users s ON b.seeker_id = s.id
       WHERE b.appointment_date = ? 
       AND b.start_time BETWEEN ? AND ?
       AND b.status = 'confirmed'`,
      [formattedDate, formattedTime, formattedTimePlus5]
    );
    
    console.log(`Found ${upcomingSessions.length} upcoming sessions`);
    
    // Create notifications for each upcoming session
    for (const session of upcomingSessions) {
      // Notify expert
      await createNotification(
        session.expert_id,
        'session_reminder',
        `Your session with ${session.seeker_name} starts in 5 minutes. Click to join.`,
        session.id
      );
      
      // Notify seeker
      await createNotification(
        session.seeker_id,
        'session_reminder',
        `Your session with ${session.expert_name} starts in 5 minutes. Click to join