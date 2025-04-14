const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Create/update expert availability
router.post('/availability/:id', auth, async (req, res) => {
    try {
        // Get db from request object
        const db = req.app.locals.db;
        
        if (!db) {
            throw new Error('Database connection not available');
        }
        
        console.log('Request body:', req.body);
        console.log('User ID from token:', req.userId);
        
        const { day_of_week, start_time, end_time, name } = req.body;
        
        // Use the ID from the URL params
        const userId = req.params.id;
        
        // Validate required fields
        if (!day_of_week || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: day_of_week, start_time, end_time'
            });
        }
        
        // Check if an entry already exists for this user on this day
        const [existingEntries] = await db.query(
            'SELECT * FROM expert_availability WHERE user_id = ? AND day_of_week = ?',
            [userId, day_of_week]
        );

        let result;
        
        if (existingEntries.length > 0) {
            // Update existing entry
            [result] = await db.query(
                `UPDATE expert_availability 
                 SET start_time = ?, end_time = ?, updated_at = NOW() 
                 WHERE user_id = ? AND day_of_week = ?`,
                [start_time, end_time, userId, day_of_week]
            );
            
            console.log('Updated existing availability');
        } else {
            // Create new entry
            [result] = await db.query(
                `INSERT INTO expert_availability 
                 (user_id, name, day_of_week, start_time, end_time, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [userId, name || null, day_of_week, start_time, end_time]
            );
            
            console.log('Created new availability entry');
        }

        res.status(200).json({
            success: true,
            message: 'Availability updated successfully',
            data: {
                day_of_week,
                start_time,
                end_time,
                user_id: userId
            }
        });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update availability',
            error: error.message
        });
    }
});

// Get expert availability
router.get('/availability/:id', auth, async (req, res) => {
    try {
        // Get db from request object
        const db = req.app.locals.db;
        
        if (!db) {
            throw new Error('Database connection not available');
        }
        
        // Use the ID from the URL params
        const userId = req.params.id;
        
        // Fetch all availability entries for this user
        const [availabilityEntries] = await db.query(
            `SELECT day_of_week, start_time, end_time, name 
             FROM expert_availability 
             WHERE user_id = ? 
             ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`,
            [userId]
        );

        res.status(200).json({
            success: true,
            message: 'Availability retrieved successfully',
            data: availabilityEntries
        });
    } catch (error) {
        console.error('Error retrieving availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve availability',
            error: error.message
        });
    }
});

module.exports = router;