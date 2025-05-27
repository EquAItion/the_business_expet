// Script to fix database issues
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

async function fixDatabase() {
  console.log('Starting database fix script...');
  
  // Create database connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true // Important for running multiple SQL statements
  });
  
  try {
    console.log('Connected to database server');
    
    // Create database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS expertise_station');
    await connection.query('USE expertise_station');
    console.log('Using expertise_station database');
    
    // Read and execute the fix-bookings.sql file
    const sqlFilePath = path.join(__dirname, 'database', 'fix-bookings.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL fix script...');
    await connection.query(sqlScript);
    console.log('SQL fix script executed successfully');
    
    // Verify the bookings table structure
    const [rows] = await connection.query('DESCRIBE bookings');
    console.log('Bookings table structure:');
    console.table(rows.map(row => ({
      Field: row.Field,
      Type: row.Type,
      Null: row.Null,
      Key: row.Key,
      Default: row.Default
    })));
    
    // Check if we have any bookings
    const [bookingCount] = await connection.query('SELECT COUNT(*) as count FROM bookings');
    console.log(`Total bookings in database: ${bookingCount[0].count}`);
    
    if (bookingCount[0].count === 0) {
      console.log('No bookings found. Creating test data...');
      
      // Get users for test data
      const [seekers] = await connection.query("SELECT id, name FROM users WHERE role = 'seeker' LIMIT 5");
      const [experts] = await connection.query("SELECT id, name FROM users WHERE role = 'expert' LIMIT 5");
      
      if (seekers.length === 0 || experts.length === 0) {
        console.log('Creating test users since none were found...');
        
        // Create test users if none exist
        if (seekers.length === 0) {
          for (let i = 0; i < 3; i++) {
            const seekerId = uuidv4();
            await connection.query(
              `INSERT INTO users (id, name, email, password, role) 
               VALUES (?, ?, ?, ?, ?)`,
              [
                seekerId,
                `Test Seeker ${i+1}`,
                `testseeker${i+1}@example.com`,
                '$2a$10$XQCg1z4YSl5K1NvK1xpYzOIby3tN7RBEhKCwcJjO5qQIWEGOOEKEa', // hashed 'password123'
                'seeker'
              ]
            );
            console.log(`Created test seeker: Test Seeker ${i+1}`);
          }
          
          // Fetch the newly created seekers
          const [newSeekers] = await connection.query("SELECT id, name FROM users WHERE role = 'seeker' LIMIT 5");
          seekers.push(...newSeekers);
        }
        
        if (experts.length === 0) {
          for (let i = 0; i < 3; i++) {
            const expertId = uuidv4();
            await connection.query(
              `INSERT INTO users (id, name, email, password, role) 
               VALUES (?, ?, ?, ?, ?)`,
              [
                expertId,
                `Test Expert ${i+1}`,
                `testexpert${i+1}@example.com`,
                '$2a$10$XQCg1z4YSl5K1NvK1xpYzOIby3tN7RBEhKCwcJjO5qQIWEGOOEKEa', // hashed 'password123'
                'expert'
              ]
            );
            console.log(`Created test expert: Test Expert ${i+1}`);
          }
          
          // Fetch the newly created experts
          const [newExperts] = await connection.query("SELECT id, name FROM users WHERE role = 'expert' LIMIT 5");
          experts.push(...newExperts);
        }
      }
      
      console.log(`Found ${seekers.length} seekers and ${experts.length} experts for test data`);
      
      // Create upcoming bookings (future dates)
      for (const seeker of seekers) {
        for (const expert of experts) {
          // Create a booking for a random date in the next 7 days
          const date = new Date();
          date.setDate(date.getDate() + Math.floor(Math.random() * 7) + 1);
          const formattedDate = date.toISOString().split('T')[0];
          
          await connection.query(
            `INSERT INTO bookings (
              id, expert_id, seeker_id, appointment_date, start_time, end_time,
              session_type, status, amount, notes
            ) VALUES (
              UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?
            )`,
            [
              expert.id,
              seeker.id,
              formattedDate,
              '10:00 AM',
              '11:00 AM',
              'video',
              'confirmed',
              100,
              'Test booking created by fix script'
            ]
          );
          
          console.log(`Created test booking: Expert ${expert.id} with Seeker ${seeker.id}`);
        }
      }
      
      // Verify test data was created
      const [newCount] = await connection.query('SELECT COUNT(*) as count FROM bookings');
      console.log(`New total bookings: ${newCount[0].count}`);
    }
    
    console.log('Database fix completed successfully');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await connection.end();
    console.log('Database connection closed');
  }
}

// Run the fix function
fixDatabase().catch(console.error);

