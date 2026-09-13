const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

let ready;

function getDb() {
  if (!ready) ready = initSchema();
  return ready;
}

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_paid INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id),
      recipient_id INTEGER REFERENCES users(id),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      attachment_name TEXT,
      attachment_data TEXT,
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query('SELECT id FROM users WHERE is_admin = 1 LIMIT 1');
  if (!rows.length) {
    const hash = bcrypt.hashSync('admin123', 10);
    await pool.query(
      'INSERT INTO users (name, email, password, is_admin, is_paid) VALUES ($1, $2, $3, 1, 1)',
      ['Admin', 'admin@makow.com', hash]
    );
  }
}

// Translates SQLite-style "?" positional placeholders to Postgres "$1, $2, ..."
function toPgSql(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function query(sql, params = []) {
  await getDb();
  const res = await pool.query(toPgSql(sql), params);
  return res.rows;
}

async function run(sql, params = []) {
  await getDb();
  const isInsert = /^\s*INSERT/i.test(sql);
  const pgSql = toPgSql(sql) + (isInsert ? ' RETURNING id' : '');
  const res = await pool.query(pgSql, params);
  return { lastID: res.rows[0]?.id };
}

module.exports = { getDb, query, run };
