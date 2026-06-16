const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'makow.db');

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initSchema();
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_paid INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      service TEXT,
      ancestry TEXT,
      time_period TEXT,
      geographic_region TEXT,
      budget TEXT,
      message TEXT,
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      recipient_id INTEGER,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      attachment_name TEXT,
      attachment_data TEXT,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    )
  `);

  // Create default admin
  const adminExists = db.exec("SELECT id FROM users WHERE is_admin = 1 LIMIT 1");
  if (!adminExists[0] || !adminExists[0].values.length) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run(
      "INSERT INTO users (name, email, password, is_admin, is_paid) VALUES (?, ?, ?, 1, 1)",
      ['Admin', 'admin@makow.com', hash]
    );
    saveDb();
  }
}

function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (e) {
    console.error('Query error:', e.message, sql);
    throw e;
  }
}

function run(sql, params = []) {
  try {
    db.run(sql, params);
    saveDb();
    const lastId = db.exec("SELECT last_insert_rowid() as id");
    return { lastID: lastId[0]?.values[0]?.[0] };
  } catch (e) {
    console.error('Run error:', e.message);
    throw e;
  }
}

module.exports = { getDb, query, run, saveDb };
