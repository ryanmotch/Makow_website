const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { getDb, query, run } = require('./db');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'makow-genealogy-secret-2024';

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (!req.user.is_admin) return res.status(403).json({ error: 'Admin only' });
    next();
  });
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hash]);
    const user = query('SELECT id, name, email, is_paid, is_admin FROM users WHERE id = ?', [result.lastID])[0];
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const users = query('SELECT * FROM users WHERE email = ?', [email]);
  if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });
  const user = users[0];
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const payload = { id: user.id, name: user.name, email: user.email, is_paid: user.is_paid, is_admin: user.is_admin };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: payload });
});

app.get('/api/me', auth, (req, res) => {
  const user = query('SELECT id, name, email, is_paid, is_admin FROM users WHERE id = ?', [req.user.id])[0];
  res.json(user);
});

// ── CONTACT FORM ──────────────────────────────────────────────────────────────

app.post('/api/contact', (req, res) => {
  const { name, email, phone, service, ancestry, time_period, geographic_region, budget, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message required' });
  run(
    'INSERT INTO contact_submissions (name, email, phone, service, ancestry, time_period, geographic_region, budget, message) VALUES (?,?,?,?,?,?,?,?,?)',
    [name, email, phone || null, service || null, ancestry || null, time_period || null, geographic_region || null, budget || null, message]
  );
  res.json({ success: true });
});

// ── MESSAGES ──────────────────────────────────────────────────────────────────

app.get('/api/messages/inbox', auth, (req, res) => {
  const msgs = query(
    `SELECT m.*, u.name as sender_name FROM messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.recipient_id = ? ORDER BY m.created_at DESC`,
    [req.user.id]
  );
  res.json(msgs);
});

app.get('/api/messages/sent', auth, (req, res) => {
  const msgs = query(
    `SELECT m.*, u.name as recipient_name FROM messages m
     LEFT JOIN users u ON u.id = m.recipient_id
     WHERE m.sender_id = ? ORDER BY m.created_at DESC`,
    [req.user.id]
  );
  res.json(msgs);
});

app.put('/api/messages/:id/read', auth, (req, res) => {
  run('UPDATE messages SET is_read = 1 WHERE id = ? AND recipient_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// Admin send message to user
app.post('/api/messages/send', auth, upload.single('attachment'), (req, res) => {
  const { recipient_id, subject, body, link } = req.body;
  if (!recipient_id || !subject || !body) return res.status(400).json({ error: 'recipient, subject and body required' });

  let attachment_name = null, attachment_data = null;
  if (req.file) {
    attachment_name = req.file.originalname;
    attachment_data = req.file.buffer.toString('base64');
  }

  run(
    'INSERT INTO messages (sender_id, recipient_id, subject, body, attachment_name, attachment_data, link) VALUES (?,?,?,?,?,?,?)',
    [req.user.id, parseInt(recipient_id), subject, body, attachment_name, attachment_data, link || null]
  );
  res.json({ success: true });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

app.get('/api/admin/contacts', adminAuth, (req, res) => {
  const contacts = query('SELECT * FROM contact_submissions ORDER BY created_at DESC');
  res.json(contacts);
});

app.put('/api/admin/contacts/:id/status', adminAuth, (req, res) => {
  run('UPDATE contact_submissions SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.json({ success: true });
});

app.get('/api/admin/users', adminAuth, (req, res) => {
  const users = query('SELECT id, name, email, is_paid, is_admin, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
});

app.put('/api/admin/users/:id/paid', adminAuth, (req, res) => {
  run('UPDATE users SET is_paid = ? WHERE id = ?', [req.body.is_paid ? 1 : 0, req.params.id]);
  res.json({ success: true });
});

app.get('/api/admin/messages', adminAuth, (req, res) => {
  const msgs = query(
    `SELECT m.*, s.name as sender_name, r.name as recipient_name
     FROM messages m
     LEFT JOIN users s ON s.id = m.sender_id
     LEFT JOIN users r ON r.id = m.recipient_id
     ORDER BY m.created_at DESC`
  );
  res.json(msgs);
});

// ── USERS LIST (for messaging) ─────────────────────────────────────────────

app.get('/api/users', auth, (req, res) => {
  const users = query('SELECT id, name, email FROM users WHERE id != ?', [req.user.id]);
  res.json(users);
});

// ── POLISH ARCHIVES PROXY ─────────────────────────────────────────────────────
// Premium-only: proxy search requests to szukajwarchiwach.gov.pl
// The site has no public API, so we fetch the HTML search page and return it,
// allowing the frontend to embed it in an iframe via our proxy URL.

const fetch = require('node-fetch');

// Proxy the PRADZIAD vital records search page for premium users
app.get('/api/archives/search', auth, async (req, res) => {
  if (!req.user.is_paid) return res.status(403).json({ error: 'Premium access required' });

  const { surname, parish, year_from, year_to, record_type } = req.query;

  // Build the search URL for szukajwarchiwach
  const params = new URLSearchParams();
  if (surname) params.set('_com_liferay_portal_search_web_portlet_SearchPortlet_keywords', surname);
  params.set('_com_liferay_portal_search_web_portlet_SearchPortlet_scope', 'everything');

  const baseUrl = 'https://www.szukajwarchiwach.gov.pl/en/wyszukiwarka-zaawansowana';

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MakowGenealogy/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    if (!response.ok) throw new Error(`Upstream status ${response.status}`);

    const html = await response.text();

    // Rewrite absolute URLs so assets load through the proxy
    const rewritten = html
      .replace(/https:\/\/www\.szukajwarchiwach\.gov\.pl/g, '/api/archives/asset')
      .replace(/<base[^>]*>/gi, '');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(rewritten);
  } catch (err) {
    res.status(502).json({ error: 'Could not reach Polish Archives. Try opening the site directly.', directUrl: `https://www.szukajwarchiwach.gov.pl/en/wyszukiwanie-akt-metrykalnych` });
  }
});

// Proxy static assets from szukajwarchiwach (CSS, JS, images)
app.get('/api/archives/asset/*', auth, async (req, res) => {
  if (!req.user.is_paid) return res.status(403).end();
  const path = req.params[0];
  try {
    const upstream = await fetch(`https://www.szukajwarchiwach.gov.pl/${path}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    upstream.body.pipe(res);
  } catch {
    res.status(502).end();
  }
});

// ── INIT & START ──────────────────────────────────────────────────────────────

getDb().then(() => {
  app.listen(PORT, () => console.log(`Makow API running on http://localhost:${PORT}`));
}).catch(console.error);
