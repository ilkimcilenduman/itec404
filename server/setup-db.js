require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    console.log('Connected to MySQL server');

    await connection.query('CREATE DATABASE IF NOT EXISTS club_management');
    console.log('Database created or already exists');

    await connection.query('USE club_management');
    console.log('Using club_management database');

    await connection.query(`
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
    console.log('Users table created');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS clubs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Clubs table created');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS club_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        club_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('member', 'president', 'vice_president', 'secretary', 'treasurer') DEFAULT 'member',
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_club_member (club_id, user_id)
      )
    `);
    console.log('Club members table created');

    await connection.query(`
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
    console.log('Events table created');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_event_registration (event_id, user_id)
      )
    `);
    console.log('Event registrations table created');

    await connection.query(`
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
    console.log('Announcements table created');

    await connection.query(`
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
    console.log('Elections table created');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS election_candidates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        election_id INT NOT NULL,
        user_id INT NOT NULL,
        position VARCHAR(50) NOT NULL,
        statement TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_election_candidate (election_id, user_id, position)
      )
    `);
    console.log('Election candidates table created');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS election_votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        election_id INT NOT NULL,
        candidate_id INT NOT NULL,
        voter_id INT NOT NULL,
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
        FOREIGN KEY (candidate_id) REFERENCES election_candidates(id) ON DELETE CASCADE,
        FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_election_vote (election_id, voter_id)
      )
    `);
    console.log('Election votes table created');

    await connection.query(`
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
    console.log('Club requests table created');

    await connection.query(`
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
    console.log('Forum posts table created');

    await connection.query(`
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
    console.log('Forum comments table created');

    await connection.query(`
      INSERT INTO users (name, email, password, student_id, role)
      VALUES ('Admin', 'admin@emu.edu.tr', '$2b$10$X/XQFCiIQpWDK5dS5vUjWOqKVGGY2pN3F9Nz4rjH2MvDbd0wMvz4e', 'ADMIN001', 'admin')
      ON DUPLICATE KEY UPDATE id=id
    `);
    console.log('Admin user created');

    await connection.query(`
      INSERT INTO clubs (name, description, category)
      VALUES
      ('Computer Society', 'A club for computer enthusiasts', 'Technology'),
      ('Photography Club', 'Capture moments and share experiences', 'Arts'),
      ('Debate Club', 'Enhance your public speaking skills', 'Academic')
      ON DUPLICATE KEY UPDATE id=id
    `);
    console.log('Sample clubs created');

    await connection.query(`
      INSERT INTO events (title, description, date, location, club_id)
      VALUES
      ('Coding Workshop', 'Learn the basics of web development', '2025-01-15 14:00:00', 'Computer Lab 101', 1),
      ('Photo Exhibition', 'Display your best photographs', '2025-01-20 10:00:00', 'Art Gallery', 2),
      ('Debate Competition', 'Compete with other students', '2025-01-25 15:00:00', 'Auditorium', 3)
      ON DUPLICATE KEY UPDATE id=id
    `);
    console.log('Sample events created');

    try {
      await connection.query(`
        ALTER TABLE announcements
        ADD COLUMN IF NOT EXISTS scheduled_date DATETIME NULL,
        ADD COLUMN IF NOT EXISTS status ENUM('published', 'scheduled') DEFAULT 'published'
      `);
      console.log('Added scheduled_date and status columns to announcements table');
    } catch (error) {
      console.error('Error adding columns to announcements table:', error);
    }

    try {
      await connection.query(`
        UPDATE announcements
        SET status = 'published'
        WHERE status IS NULL
      `);
      console.log('Updated existing announcements to have status=\'published\'');
    } catch (error) {
      console.error('Error updating existing announcements:', error);
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
