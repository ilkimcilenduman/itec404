-- Create database
CREATE DATABASE IF NOT EXISTS club_management;
USE club_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  role ENUM('student', 'club_president', 'admin') DEFAULT 'student',
  gender VARCHAR(20),
  nationality VARCHAR(50),
  major VARCHAR(100),
  year_of_study INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Club members table
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
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  date DATETIME NOT NULL,
  location VARCHAR(100),
  club_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_event_registration (event_id, user_id)
);

-- Announcements table
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
);

-- Elections table
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
);

-- Election candidates table
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
);

-- Election votes table
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
);

-- Insert admin user
INSERT INTO users (name, email, password, student_id, role)
VALUES ('Admin', 'admin@emu.edu.tr', '$2b$10$X/XQFCiIQpWDK5dS5vUjWOqKVGGY2pN3F9Nz4rjH2MvDbd0wMvz4e', 'ADMIN001', 'admin');
-- Password is 'admin123'

-- Insert sample clubs
INSERT INTO clubs (name, description, category)
VALUES
('Computer Society', 'A club for computer enthusiasts', 'Technology'),
('Photography Club', 'Capture moments and share experiences', 'Arts'),
('Debate Club', 'Enhance your public speaking skills', 'Academic');

-- Insert sample events
INSERT INTO events (title, description, date, location, club_id)
VALUES
('Coding Workshop', 'Learn the basics of web development', '2025-01-15 14:00:00', 'Computer Lab 101', 1),
('Photo Exhibition', 'Display your best photographs', '2025-01-20 10:00:00', 'Art Gallery', 2),
('Debate Competition', 'Compete with other students', '2025-01-25 15:00:00', 'Auditorium', 3);

-- Forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  post_id INT AUTO_INCREMENT PRIMARY KEY,
  club_id INT NOT NULL,
  user_id INT NOT NULL,
  forum_title VARCHAR(200) NOT NULL,
  forum_content TEXT NOT NULL,
  forum_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Forum comments table
CREATE TABLE IF NOT EXISTS forum_comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_content TEXT NOT NULL,
  comment_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
