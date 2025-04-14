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

-- Run these SQL commands to verify table structure
SHOW TABLES;
DESCRIBE users;
DESCRIBE expert_profiles;

-- Check if expert data exists
SELECT u.*, ep.* 
FROM users u 
LEFT JOIN expert_profiles ep ON u.id = ep.user_id 
WHERE u.role = 'expert';