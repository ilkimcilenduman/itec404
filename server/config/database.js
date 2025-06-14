const mysql = require('mysql2/promise');

/**
 * Database configuration and initialization module
 * This module handles all database-related operations including:
 * - Creating a connection pool
 * - Testing the connection
 * - Initializing database tables
 */

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'club_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your MySQL server is running and your .env file has correct database credentials');
    return false;
  }
};

/**
 * Initialize database tables
 * This function creates all necessary tables if they don't exist
 */
const initDatabase = async () => {
  try {
    console.log('Initializing database tables...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        student_id VARCHAR(20) NOT NULL UNIQUE,
        role ENUM('student', 'club_president', 'admin') DEFAULT 'student',
        profile_image VARCHAR(255),
        gender VARCHAR(20),
        nationality VARCHAR(50),
        major VARCHAR(100),
        year_of_study INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clubs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        club_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('member', 'president', 'vice_president', 'secretary', 'treasurer') DEFAULT 'member',
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_club_user (club_id, user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        date DATETIME NOT NULL,
        location VARCHAR(100),
        club_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_event_user (event_id, user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        club_id INT NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scheduled_date DATETIME NULL,
        status ENUM('published', 'scheduled') DEFAULT 'published',
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS elections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        club_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS election_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        election_id INT NOT NULL,
        role_name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
        UNIQUE KEY unique_election_role (election_id, role_name)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS election_candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        election_id INT NOT NULL,
        user_id INT NOT NULL,
        role_id INT,
        position VARCHAR(100) NOT NULL,
        statement TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES election_roles(id) ON DELETE SET NULL,
        UNIQUE KEY unique_election_user (election_id, user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS election_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        election_id INT NOT NULL,
        candidate_id INT NOT NULL,
        voter_id INT NOT NULL,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_id) REFERENCES election_candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_election_voter (election_id, voter_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS candidate_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        election_id INT NOT NULL,
        role_id INT NOT NULL,
        user_id INT NOT NULL,
        statement TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES election_roles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_election_user_role (election_id, user_id, role_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        requester_id INT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        admin_feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forum_posts (
        post_id INT AUTO_INCREMENT PRIMARY KEY,
        club_id INT NOT NULL,
        user_id INT NOT NULL,
        forum_title VARCHAR(200) NOT NULL,
        forum_content TEXT NOT NULL,
        forum_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS forum_comments (
        comment_id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        comment_content TEXT NOT NULL,
        comment_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    try {
      await pool.query(`
        ALTER TABLE announcements
        ADD COLUMN IF NOT EXISTS scheduled_date DATETIME NULL,
        ADD COLUMN IF NOT EXISTS status ENUM('published', 'scheduled') DEFAULT 'published'
      `);
      console.log('Added scheduled_date and status columns to announcements table');
    } catch (error) {
      console.error('Error adding columns to announcements table:', error);
    }

    try {
      await pool.query(`
        UPDATE announcements
        SET status = 'published'
        WHERE status IS NULL
      `);
      console.log('Updated existing announcements to have status=\'published\'');
    } catch (error) {
      console.error('Error updating existing announcements:', error);
    }

    console.log('✅ Database tables initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Error initializing database tables:', error);
    return false;
  }
};

/**
 * Setup database
 * This function tests the connection and initializes the database
 * @returns {Promise<boolean>} True if setup is successful, false otherwise
 */
const setupDatabase = async () => {
  try {
    const isConnected = await testConnection();

    if (!isConnected) {
      return false;
    }

    const isInitialized = await initDatabase();

    return isInitialized;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  initDatabase,
  setupDatabase
};
