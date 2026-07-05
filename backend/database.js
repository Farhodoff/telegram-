const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'telegram.db');
const db = new Database(dbPath);

// Initialization: Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    username TEXT UNIQUE,
    bio TEXT,
    avatar TEXT,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER,
    text TEXT,
    media_url TEXT,
    message_type TEXT DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT 0,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
  );
`);

module.exports = db;
