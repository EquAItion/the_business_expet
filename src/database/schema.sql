-- Create database if not exists
CREATE DATABASE IF NOT EXISTS expertise_station;

USE expertise_station;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  industry VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expert profiles table
CREATE TABLE IF NOT EXISTS expert_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    work_experience INT NOT NULL,
    current_organization VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    expertise TEXT NOT NULL,
    areas_of_help TEXT NOT NULL,
    video_pricing DECIMAL(10,2),
    audio_pricing DECIMAL(10,2),
    chat_pricing DECIMAL(10,2),
    linkedin_url VARCHAR(255),
    twitter_url VARCHAR(255),
    instagram_url VARCHAR(255),
    youtube_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seeker profiles table
CREATE TABLE IF NOT EXISTS seeker_profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    company VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    experience VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    bio TEXT NOT NULL,
    interests VARCHAR(255) NOT NULL,
    linkedin_url VARCHAR(255),
    website_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create auth_tokens table
CREATE TABLE IF NOT EXISTS auth_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webinar_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    profession VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    area_of_interest VARCHAR(255) NOT NULL,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS business_plans (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    product_description TEXT NOT NULL,
    industry VARCHAR(100) NOT NULL,
    target_audience TEXT NOT NULL,
    objectives JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE expert_availability (
  id INT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(36) NOT NULL,  -- Changed from INT to match users.id
  name VARCHAR(255) NULL,
  day_of_week VARCHAR(50) NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (id),
  -- Composite index for efficient lookups by user_id and day_of_week
  INDEX idx_user_day (user_id, day_of_week),
  -- Constraint to ensure each user can only have one entry per day
  UNIQUE KEY unique_user_day (user_id, day_of_week),
  
  -- Foreign key constraint now correctly references VARCHAR(36)
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Add a comment to the table for documentation
ALTER TABLE expert_availability 
  COMMENT 'Stores expert availability schedules by day of week';


  -- Notifications table to store user notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  related_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE bookings
ADD COLUMN start_time TIME NOT NULL AFTER appointment_date,
ADD COLUMN end_time TIME NOT NULL AFTER start_time,
ADD COLUMN session_type VARCHAR(20) NOT NULL AFTER end_time,
ADD COLUMN amount DECIMAL(10,2) DEFAULT 0 AFTER session_type,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;




-- Bookings table to store session bookings between seekers and experts
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  expert_id VARCHAR(36) NOT NULL,
  seeker_id VARCHAR(36) NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  session_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, rescheduled
  amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE
);




-- Run these SQL commands to verify table structure
SHOW TABLES;
DESCRIBE users;
DESCRIBE expert_profiles;

-- Check if expert data exists
SELECT u.*, ep.* 
FROM users u 
LEFT JOIN expert_profiles ep ON u.id = ep.user_id 
WHERE u.role = 'expert';















-- booking related new schema 

-- Fix bookings table structure issues

-- First, let's check the current structure
SHOW CREATE TABLE bookings;

-- 1. Fix column naming inconsistencies
-- Check if appointment_time exists and drop it if it does
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns
WHERE table_schema = 'expertise_station'
  AND table_name = 'bookings'
  AND column_name = 'appointment_time';

SET @stmt = IF(@col_exists > 0,
               'ALTER TABLE bookings DROP COLUMN appointment_time',
               'SELECT "No appointment_time column to drop"');

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Ensure we have the correct columns with proper types
-- Make sure start_time and end_time are VARCHAR for consistent format
ALTER TABLE bookings MODIFY COLUMN start_time VARCHAR(10) NOT NULL;
ALTER TABLE bookings MODIFY COLUMN end_time VARCHAR(10) NOT NULL;

-- 3. Standardize session_type and status as ENUMs
ALTER TABLE bookings MODIFY COLUMN session_type ENUM('video', 'audio', 'chat') DEFAULT 'video';
ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'rejected') DEFAULT 'pending';

-- 4. Add notes column if it doesn't exist
SELECT COUNT(*) INTO @col_exists
FROM information_schema.columns
WHERE table_schema = 'expertise_station'
  AND table_name = 'bookings'
  AND column_name = 'notes';

SET @stmt = IF(@col_exists = 0,
               'ALTER TABLE bookings ADD COLUMN notes TEXT AFTER amount',
               'SELECT "Notes column already exists"');

PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_seeker ON bookings(seeker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_expert ON bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(appointment_date);

-- 6. Insert test data if the table is empty
INSERT INTO bookings (id, expert_id, seeker_id, appointment_date, start_time, end_time, session_type, status, amount, notes)
SELECT 
    UUID(), 
    e.id, 
    s.id, 
    CURDATE() + INTERVAL (1 + FLOOR(RAND() * 7)) DAY,
    CONCAT(8 + FLOOR(RAND() * 8), ':00 ', IF(8 + FLOOR(RAND() * 8) < 12, 'AM', 'PM')),
    CONCAT(9 + FLOOR(RAND() * 8), ':00 ', IF(9 + FLOOR(RAND() * 8) < 12, 'AM', 'PM')),
    ELT(1 + FLOOR(RAND() * 3), 'video', 'audio', 'chat'),
    'confirmed',
    50 + FLOOR(RAND() * 150),
    'Test booking created by database script'
FROM 
    users e 
    CROSS JOIN users s
WHERE 
    e.role = 'expert' AND s.role = 'seeker'
    AND NOT EXISTS (SELECT 1 FROM bookings)
LIMIT 10;

-- 7. Verify the structure and data
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10;











-- Make sure the bookings table has the correct structure
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(36) PRIMARY KEY,
  expert_id VARCHAR(36) NOT NULL,
  seeker_id VARCHAR(36) NOT NULL,
  appointment_date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  session_type ENUM('video', 'audio', 'chat') DEFAULT 'video',
  status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'rejected') DEFAULT 'pending',
  amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (expert_id) REFERENCES users(id),
  FOREIGN KEY (seeker_id) REFERENCES users(id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_seeker ON bookings(seeker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_expert ON bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(appointment_date);






-- notifications table  


CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  related_id VARCHAR(255),
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add read_status column to notifications table if it doesn't exist
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_status BOOLEAN DEFAULT FALSE;


