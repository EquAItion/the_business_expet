const express = require('express');
const router = express.Router();

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = req.app.locals.db;
    
    console.log(`Fetching user with ID: ${id}`);
    
    const [users] = await pool.query(
      `SELECT id, name, email, role, profile_image 
       FROM users WHERE id = ?`,
      [id]
    );
    
    if (users.length === 0) {
      console.log(`User with ID ${id} not found`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

module.exports = router;

