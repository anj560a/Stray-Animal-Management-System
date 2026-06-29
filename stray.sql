CREATE DATABASE IF NOT EXISTS stray_animals;
USE stray_animals;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','volunteer') NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    otp VARCHAR(6),
    otp_expires BIGINT,
    verified TINYINT DEFAULT 0
);

INSERT INTO users (username, password, role, email, verified)
VALUES ('admin', 'admin123', 'admin', 'admin@gmail.com', 1)
ON DUPLICATE KEY UPDATE username=username;


CREATE TABLE IF NOT EXISTS animals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    breed VARCHAR(50),
    color VARCHAR(50),
    health VARCHAR(50),
    location VARCHAR(100),
    status VARCHAR(50),
    date_found DATE
);


CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(50),
    location VARCHAR(100),
    description TEXT,
    status VARCHAR(50) DEFAULT 'Submitted'
);

CREATE TABLE IF NOT EXISTS adoptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal_name VARCHAR(50) NOT NULL,
    requested_by VARCHAR(50) NOT NULL,
    reason TEXT
);
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT
);