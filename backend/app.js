const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fetch = require('node-fetch');
const Stripe = require('stripe');
const { getDb, query, run } = require('./db');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'makow-genealogy-secret-2024';

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
// Keep the raw body for the Stripe webhook - signature verification needs the exact bytes.
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => { if (req.originalUrl === '/api/billing/webhook') req.rawBody = buf; },
}));

// Ensure the DB schema/seed is ready before any route runs (cheap no-op once warm).
app.use((req, res, next) => {
  getDb().then(() => next()).catch(next);
});

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

// Checks paid status against the DB rather than the JWT, so a cancelled
// membership loses access immediately instead of when the token expires.
function paidAuth(req, res, next) {
  auth(req, res, async () => {
    const rows = await query('SELECT is_paid FROM users WHERE id = ?', [req.user.id]);
    if (!rows[0]?.is_paid) return res.status(403).json({ error: 'Premium access required' });
    next();
  });
}

function issueToken(user) {
  const payload = { id: user.id, name: user.name, email: user.email, is_paid: user.is_paid, is_admin: user.is_admin };
  return { token: jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }), user: payload };
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = await run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hash]);
    const user = (await query('SELECT id, name, email, is_paid, is_admin FROM users WHERE id = ?', [result.lastID]))[0];
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const users = await query('SELECT * FROM users WHERE email = ?', [email]);
  if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });
  const user = users[0];
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  const payload = { id: user.id, name: user.name, email: user.email, is_paid: user.is_paid, is_admin: user.is_admin };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: payload });
});

app.get('/api/me', auth, async (req, res) => {
  const user = (await query('SELECT id, name, email, is_paid, is_admin FROM users WHERE id = ?', [req.user.id]))[0];
  res.json(user);
});

// Re-issues the JWT from current DB values, e.g. after paid status changes.
app.post('/api/token/refresh', auth, async (req, res) => {
  const user = (await query('SELECT id, name, email, is_paid, is_admin FROM users WHERE id = ?', [req.user.id]))[0];
  if (!user) return res.status(401).json({ error: 'Account not found' });
  res.json(issueToken(user));
});

// ── BILLING (Stripe) ──────────────────────────────────────────────────────────
// $10/month membership. Checkout grants is_paid; the webhook keeps it in sync
// with the subscription (renewal failures, cancellations).

let stripeClient;
function stripe() {
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

// Redirect back to whichever allowed frontend origin started the request.
function frontendUrl(req) {
  const origin = req.headers.origin;
  return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
}

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'];

app.post('/api/billing/checkout', auth, async (req, res) => {
  try {
    const user = (await query('SELECT * FROM users WHERE id = ?', [req.user.id]))[0];
    if (!user) return res.status(401).json({ error: 'Account not found' });
    if (user.is_paid) return res.status(400).json({ error: 'You already have a paid membership' });

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: user.email, name: user.name, metadata: { user_id: String(user.id) },
      });
      customerId = customer.id;
      await run('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customerId, user.id]);
    }

    const base = frontendUrl(req);
    const session = await stripe().checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: String(user.id),
      line_items: [{
        quantity: 1,
        ...(process.env.STRIPE_PRICE_ID
          ? { price: process.env.STRIPE_PRICE_ID }
          : { price_data: {
              currency: 'usd',
              unit_amount: 1000,
              recurring: { interval: 'month' },
              product_data: { name: 'Makow Genealogy Membership' },
            } }),
      }],
      subscription_data: { metadata: { user_id: String(user.id) } },
      success_url: `${base}/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/account?checkout=cancelled`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
});

// Called when Stripe redirects back, so the member gets access immediately
// without waiting for the webhook. Returns a fresh token with is_paid set.
app.post('/api/billing/confirm', auth, async (req, res) => {
  try {
    const session = await stripe().checkout.sessions.retrieve(String(req.body.session_id || ''));
    if (session.client_reference_id !== String(req.user.id)) {
      return res.status(403).json({ error: 'This checkout belongs to another account' });
    }
    if (session.status === 'complete') {
      await run('UPDATE users SET is_paid = 1, stripe_subscription_id = ? WHERE id = ?', [session.subscription, req.user.id]);
    }
    const user = (await query('SELECT id, name, email, is_paid, is_admin FROM users WHERE id = ?', [req.user.id]))[0];
    res.json(issueToken(user));
  } catch (err) {
    console.error('Checkout confirm error:', err);
    res.status(400).json({ error: 'Could not confirm payment' });
  }
});

// Stripe-hosted page where members update their card or cancel.
app.post('/api/billing/portal', auth, async (req, res) => {
  try {
    const user = (await query('SELECT stripe_customer_id FROM users WHERE id = ?', [req.user.id]))[0];
    if (!user?.stripe_customer_id) return res.status(400).json({ error: 'No billing account found' });
    const session = await stripe().billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${frontendUrl(req)}/account`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Billing portal error:', err);
    res.status(500).json({ error: 'Could not open billing settings. Please try again.' });
  }
});

app.post('/api/billing/webhook', async (req, res) => {
  let event;
  try {
    event = stripe().webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature error: ${err.message}`);
  }

  try {
    const obj = event.data.object;
    if (event.type === 'checkout.session.completed' && obj.mode === 'subscription') {
      await run('UPDATE users SET is_paid = 1, stripe_customer_id = ?, stripe_subscription_id = ? WHERE id = ?',
        [obj.customer, obj.subscription, parseInt(obj.client_reference_id)]);
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const paid = event.type === 'customer.subscription.updated' && ACTIVE_STATUSES.includes(obj.status);
      // Only act on the subscription we have on record, so a late event for an
      // old cancelled subscription can't revoke a member who re-subscribed.
      await run(
        'UPDATE users SET is_paid = ? WHERE stripe_customer_id = ? AND (stripe_subscription_id = ? OR stripe_subscription_id IS NULL)',
        [paid ? 1 : 0, obj.customer, obj.id]);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handling error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// ── CONTACT FORM ──────────────────────────────────────────────────────────────

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, service, ancestry, time_period, geographic_region, budget, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message required' });
  await run(
    'INSERT INTO contact_submissions (name, email, phone, service, ancestry, time_period, geographic_region, budget, message) VALUES (?,?,?,?,?,?,?,?,?)',
    [name, email, phone || null, service || null, ancestry || null, time_period || null, geographic_region || null, budget || null, message]
  );
  res.json({ success: true });
});

// ── MESSAGES ──────────────────────────────────────────────────────────────────

app.get('/api/messages/inbox', auth, async (req, res) => {
  const msgs = await query(
    `SELECT m.*, u.name as sender_name FROM messages m
     LEFT JOIN users u ON u.id = m.sender_id
     WHERE m.recipient_id = ? ORDER BY m.created_at DESC`,
    [req.user.id]
  );
  res.json(msgs);
});

app.get('/api/messages/sent', auth, async (req, res) => {
  const msgs = await query(
    `SELECT m.*, u.name as recipient_name FROM messages m
     LEFT JOIN users u ON u.id = m.recipient_id
     WHERE m.sender_id = ? ORDER BY m.created_at DESC`,
    [req.user.id]
  );
  res.json(msgs);
});

app.put('/api/messages/:id/read', auth, async (req, res) => {
  await run('UPDATE messages SET is_read = 1 WHERE id = ? AND recipient_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

// Admin send message to user
app.post('/api/messages/send', auth, upload.single('attachment'), async (req, res) => {
  const { recipient_id, subject, body, link } = req.body;
  if (!recipient_id || !subject || !body) return res.status(400).json({ error: 'recipient, subject and body required' });

  let attachment_name = null, attachment_data = null;
  if (req.file) {
    attachment_name = req.file.originalname;
    attachment_data = req.file.buffer.toString('base64');
  }

  await run(
    'INSERT INTO messages (sender_id, recipient_id, subject, body, attachment_name, attachment_data, link) VALUES (?,?,?,?,?,?,?)',
    [req.user.id, parseInt(recipient_id), subject, body, attachment_name, attachment_data, link || null]
  );
  res.json({ success: true });
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

app.get('/api/admin/contacts', adminAuth, async (req, res) => {
  const contacts = await query('SELECT * FROM contact_submissions ORDER BY created_at DESC');
  res.json(contacts);
});

app.put('/api/admin/contacts/:id/status', adminAuth, async (req, res) => {
  await run('UPDATE contact_submissions SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.json({ success: true });
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  const users = await query('SELECT id, name, email, is_paid, is_admin, created_at FROM users ORDER BY created_at DESC');
  res.json(users);
});

app.put('/api/admin/users/:id/paid', adminAuth, async (req, res) => {
  await run('UPDATE users SET is_paid = ? WHERE id = ?', [req.body.is_paid ? 1 : 0, req.params.id]);
  res.json({ success: true });
});

app.get('/api/admin/messages', adminAuth, async (req, res) => {
  const msgs = await query(
    `SELECT m.*, s.name as sender_name, r.name as recipient_name
     FROM messages m
     LEFT JOIN users s ON s.id = m.sender_id
     LEFT JOIN users r ON r.id = m.recipient_id
     ORDER BY m.created_at DESC`
  );
  res.json(msgs);
});

// ── USERS LIST (for messaging) ─────────────────────────────────────────────

app.get('/api/users', auth, async (req, res) => {
  const users = await query('SELECT id, name, email FROM users WHERE id != ?', [req.user.id]);
  res.json(users);
});

// ── POLISH ARCHIVES PROXY ─────────────────────────────────────────────────────
// Premium-only: proxy search requests to szukajwarchiwach.gov.pl
// The site has no public API, so we fetch the HTML search page and return it,
// allowing the frontend to embed it in an iframe via our proxy URL.

// Proxy the PRADZIAD vital records search page for premium users
app.get('/api/archives/search', paidAuth, async (req, res) => {
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
app.get('/api/archives/asset/*', paidAuth, async (req, res) => {  const path = req.params[0];
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

module.exports = app;
