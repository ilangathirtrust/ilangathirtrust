CREATE DATABASE IF NOT EXISTS ilangathir_trust CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ilangathir_trust;

CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','editor') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS team_members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  designation VARCHAR(160) NOT NULL DEFAULT '',
  biography TEXT,
  image_path VARCHAR(255),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS activities (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  description TEXT NOT NULL,
  image_path VARCHAR(255),
  activity_date DATE NULL,
  location VARCHAR(220) NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS gallery_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  image_path VARCHAR(255) NOT NULL,
  caption VARCHAR(255) DEFAULT '',
  category VARCHAR(100) DEFAULT 'Other Activities',
  event_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS news_posts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  body TEXT NOT NULL,
  cover_image VARCHAR(255),
  event_date DATE NULL,
  location VARCHAR(220) NULL,
  status ENUM('draft','published') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS contact_enquiries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NULL,
  subject VARCHAR(220) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('new','read','closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  district VARCHAR(120) NOT NULL,
  interest VARCHAR(180) NOT NULL,
  message TEXT,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  status ENUM('new','reviewing','contacted','closed') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
('trust_name','Ilangathir Arakattalai'),
('trust_name_tamil','இளங்கதிர் அறக்கட்டளை'),
('tagline','Together, We Can Create a Brighter Tomorrow.'),
('about_text','Ilangathir Arakattalai is committed to building a caring, inclusive, and empowered society through meaningful community initiatives and social welfare activities.'),
('phone','+91 93630 15050'),
('email','ilangathirtrust@gmail.com'),
('address','V. கல்லுப்பட்டி, திண்டுக்கல் - 624307, தமிழ்நாடு.'),
('founder_name','Founder name to be confirmed'),
('founder_bio','Add the verified founder biography from the trust.'),
('office_hours','Please contact the trust to confirm office hours.');
