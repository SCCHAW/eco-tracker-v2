-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'organizer', 'volunteer', 'admin')) DEFAULT 'student',
    eco_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT CHECK(event_type IN ('cleanup', 'awareness', 'workshop', 'other')) NOT NULL,
    location TEXT,
    event_date DATETIME NOT NULL,
    event_time TEXT,
    organizer_id INTEGER NOT NULL,
    max_participants INTEGER,
    eco_points_reward INTEGER DEFAULT 10,
    agenda TEXT,
    requirements TEXT,
    status TEXT CHECK(status IN ('pending', 'upcoming', 'ongoing', 'completed', 'cancelled')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- Event participants table
CREATE TABLE IF NOT EXISTS event_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    attended BOOLEAN DEFAULT 0,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(event_id, user_id)
);

-- Recycling logs table
CREATE TABLE IF NOT EXISTS recycling_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT CHECK(category IN ('plastic', 'paper', 'metal', 'glass', 'electronics', 'organic', 'other')) NOT NULL,
    weight REAL NOT NULL,
    image_url TEXT,
    description TEXT,
    volunteer_hours REAL DEFAULT 0,
    eco_points_earned INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT 0,
    verified_by INTEGER,
    verified_at DATETIME,
    event_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    requirement_type TEXT CHECK(requirement_type IN ('events', 'recycling', 'points', 'custom')) NOT NULL,
    requirement_value INTEGER NOT NULL,
    eco_points_reward INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_id INTEGER NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE(user_id, achievement_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK(type IN ('event', 'achievement', 'admin', 'system')) DEFAULT 'system',
    read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Event announcements table (for notifications sent to future participants)
CREATE TABLE IF NOT EXISTS event_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    phone_number TEXT,
    address TEXT,
    student_id TEXT UNIQUE,
    major_program TEXT,
    year INTEGER,
    interests TEXT,
    bio TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    profile_picture_url TEXT,
    emergency_contact_relationship TEXT,
    organization TEXT,
    position TEXT,
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default achievements
INSERT OR IGNORE INTO achievements (id, name, description, icon, requirement_type, requirement_value, eco_points_reward) VALUES
(1, 'First Steps', 'Register for your first event', '🌱', 'events', 1, 5),
(2, 'Eco Warrior', 'Attend 5 events', '⚔️', 'events', 5, 25),
(3, 'Recycling Novice', 'Log 10kg of recycling', '♻️', 'recycling', 10, 15),
(4, 'Point Collector', 'Earn 100 eco points', '⭐', 'points', 100, 20),
(5, 'Sustainability Champion', 'Attend 10 events', '🏆', 'events', 10, 50);


-- ========================================
-- DATABASE MIGRATION - System Settings Table
-- ========================================
-- Run this SQL in your SQLite database

CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert default settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('auto_approve_logs', 'false', 'Automatically approve recycling logs without admin review'),
('maintenance_mode', 'false', 'Enable maintenance mode to restrict user access'),
('last_backup', '', 'Timestamp of last database backup'),
('backup_enabled', 'true', 'Enable automatic database backups');

-- Create system_logs table for tracking system actions
CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    performed_by INTEGER NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by) REFERENCES users(id)
);