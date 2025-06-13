const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get expert availability
router.get('/availability/:id', auth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const expertId = req.params.id;

        const [availabilitySlots] = await db.query(
            `SELECT * FROM expert_availability 
             WHERE user_id = ? 
             ORDER BY FIELD(day_of_week, 
                'Monday', 'Tuesday', 'Wednesday', 
                'Thursday', 'Friday', 'Saturday', 'Sunday')`,
            [expertId]
        );

        res.json({
            success: true,
            message: 'Availability retrieved successfully',
            data: availabilitySlots
        });

    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch availability',
            error: error.message
        });
    }
});

// Create/update expert availability
router.post('/availability/:id', auth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { day_of_week, start_time, end_time, name } = req.body;
        const expertId = req.params.id;

        // Validate required fields
        if (!day_of_week || !start_time || !end_time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Check if slot exists
        const [existingSlot] = await db.query(
            'SELECT id FROM expert_availability WHERE user_id = ? AND day_of_week = ?',
            [expertId, day_of_week]
        );

        let result;
        if (existingSlot.length > 0) {
            // Update existing slot
            [result] = await db.query(
                `UPDATE expert_availability 
                 SET start_time = ?, 
                     end_time = ?, 
                     name = ?, 
                     updated_at = NOW()
                 WHERE user_id = ? AND day_of_week = ?`,
                [start_time, end_time, name, expertId, day_of_week]
            );

            console.log('✅ Updated existing availability slot');
        } else {
            // Create new slot
            [result] = await db.query(
                `INSERT INTO expert_availability 
                 (user_id, day_of_week, start_time, end_time, name, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [expertId, day_of_week, start_time, end_time, name]
            );

            console.log('✅ Created new availability slot');
        }

        res.json({
            success: true,
            message: `Availability ${existingSlot.length > 0 ? 'updated' : 'created'} successfully`,
            data: {
                user_id: expertId,
                day_of_week,
                start_time,
                end_time,
                name
            }
        });

    } catch (error) {
        console.error('❌ Error updating availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update availability',
            error: error.message
        });
    }
});

module.exports = router;