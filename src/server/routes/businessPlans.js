const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../server');
const auth = require('../middleware/auth');

// Create a business plan
router.post('/', auth, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const { businessName, productDescription, industry, targetAudience, objectives } = req.body;
        
        // Validate required fields
        if (!businessName || !productDescription || !industry || !targetAudience || !objectives) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Create new business plan
        const planId = uuidv4();
        
        await connection.execute(
            'INSERT INTO business_plans (id, user_id, business_name, product_description, industry, target_audience, objectives) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                planId, 
                req.user.user_id, 
                businessName, 
                productDescription, 
                industry, 
                targetAudience, 
                JSON.stringify(objectives)
            ]
        );
        
        res.status(201).json({
            success: true,
            message: 'Business plan created successfully',
            data: {
                id: planId,
                businessName,
                industry
            }
        });
    } catch (error) {
        console.error('Create business plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating business plan'
        });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;