const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'genealogy.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_paid INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    service_interest TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
  );
`);

// Seed admin user
const adminPassword = bcrypt.hashSync('admin123', 10);
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@makow.com');
if (!existing) {
  db.prepare(
    'INSERT INTO users (name, email, password, is_paid, is_admin) VALUES (?, ?, ?, ?, ?)'
  ).run('Admin', 'admin@makow.com', adminPassword, 1, 1);
  console.log('Admin user created: admin@makow.com / admin123');
}

console.log('Database initialized successfully.');
db.close();
