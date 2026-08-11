const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Use Aiven cloud MySQL credentials from .env.
// HeidiSQL is only a client for these same values.
const sslConfig = {};
const sslEnabled = process.env.DB_SSL !== 'false' && process.env.DB_SSL !== '0' && process.env.DB_SSL !== 'no';
const sslCaPath = process.env.DB_SSL_CA_PATH;

if (sslEnabled) {
    if (sslCaPath) {
        const caFullPath = path.resolve(__dirname, '../../', sslCaPath);
        if (fs.existsSync(caFullPath)) {
            sslConfig.ca = fs.readFileSync(caFullPath, 'utf8');
        } else {
            console.warn(`SSL CA file not found at ${caFullPath}; using a permissive TLS setting instead.`);
        }
    }

    const rejectUnauthorizedValue = process.env.DB_SSL_REJECT_UNAUTHORIZED;
    sslConfig.rejectUnauthorized = rejectUnauthorizedValue === undefined
        ? false
        : rejectUnauthorizedValue !== 'false' && rejectUnauthorizedValue !== '0' && rejectUnauthorizedValue !== 'no';
}

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    ssl: sslEnabled ? sslConfig : false
};

const pool = mysql.createPool(dbConfig);

async function initializeDatabase() {
    const statements = [
        `CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id VARCHAR(8) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            rfid_tag VARCHAR(50) NOT NULL UNIQUE,
            course VARCHAR(50) NOT NULL,
            year INT NOT NULL,
            section VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT chk_student_id_format CHECK (student_id REGEXP '^[0-9]{2}-[0-9]{4}$')
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        `CREATE TABLE IF NOT EXISTS subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(10) NOT NULL,
            teacher VARCHAR(100) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        `CREATE TABLE IF NOT EXISTS records (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            category ENUM('quizzes', 'exams', 'activities') NOT NULL,
            record_number INT NOT NULL,
            items INT NOT NULL,
            score FLOAT NOT NULL,
            subject ENUM('IT223', 'IT221') NOT NULL,
            date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            UNIQUE KEY category_number (student_id, category, record_number, subject)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        `CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            subject_id INT NOT NULL,
            date_time DATETIME NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    ];

    for (const statement of statements) {
        await pool.query(statement);
    }
}

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Database connection successful');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message || error);
        return false;
    }
}

module.exports = {
    pool,
    initializeDatabase,
    testConnection
}; 