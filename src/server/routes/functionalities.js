const express = require('express');
const router = express.Router();

// Get all functionality options
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await req.app.locals.db.getConnection();
        const [functionalities] = await connection.execute(
            'SELECT id, option_value, display_name FROM expert_functionality_options WHERE is_active = true'
        );

        res.json({
            success: true,
            data: functionalities
        });
    } catch (error) {
        console.error('Error fetching functionalities:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching functionality options'
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;