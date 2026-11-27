const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const getSessionSecret = () => process.env.SESSION_SECRET || 'ilangathir_arakattalai_super_secure_random_session_key_2026_trust';
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ilangathir_trust',
  waitForConnections: true, connectionLimit: 10, queueLimit: 0, connectTimeout: 3000
});
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 180, standardHeaders: true, legacyHeaders: false }));

const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 9) + path.extname(file.originalname).toLowerCase())
});
const upload = multer({
  storage, limits: { fileSize: (Number(process.env.MAX_UPLOAD_MB) || 5) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
});

const storeFile = path.join(__dirname, 'data', 'store.json');
function readStore() {
  try {
    if (fs.existsSync(storeFile)) {
      return JSON.parse(fs.readFileSync(storeFile, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading store.json:', e);
  }
  return {
    site_settings: {},
    activities: [],
    news_posts: [],
    gallery_images: [],
    team_members: [],
    contact_enquiries: [],
    volunteer_applications: []
  };
}

function writeStore(data) {
  try {
    fs.mkdirSync(path.dirname(storeFile), { recursive: true });
    fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing store.json:', e);
  }
}

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts. Try again later.' } });
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(err => {
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR') {
    return res.status(503).json({ error: 'Database is currently offline. Please start MySQL in XAMPP Control Panel.' });
  }
  next(err);
});

function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Please sign in.' });
  try { req.admin = jwt.verify(token, getSessionSecret()); next(); }
  catch { res.clearCookie('admin_token'); return res.status(401).json({ error: 'Session expired. Sign in again.' }); }
}
function requireEditor(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.admin.role !== 'admin' && req.method !== 'GET') return res.status(403).json({ error: 'Admin role required for this action.' });
    next();
  });
}
const tables = {
  activities: { table: 'activities', fields: ['title', 'description', 'image_path', 'activity_date', 'location', 'status'], required: ['title', 'description'] },
  news: { table: 'news_posts', fields: ['title', 'body', 'cover_image', 'event_date', 'location', 'status'], required: ['title', 'body'] },
  team: { table: 'team_members', fields: ['name', 'designation', 'biography', 'image_path', 'sort_order'], required: ['name', 'designation'] },
  gallery: { table: 'gallery_images', fields: ['image_path', 'caption', 'category', 'event_date'], required: ['image_path'] }
};
function safeTable(key) { const item = tables[key]; if (!item) throw Object.assign(new Error('Unknown content type.'), { status: 404 }); return item; }

const storeKeyMap = {
  activities: 'activities',
  news: 'news_posts',
  team: 'team_members',
  gallery: 'gallery_images',
  enquiries: 'contact_enquiries',
  volunteers: 'volunteer_applications'
};

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1 AS ok');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.json({ status: 'ok', database: 'fallback', message: 'Local storage active' });
  }
});

app.get('/api/public/settings', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key,setting_value FROM site_settings');
    return res.json(Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value])));
  } catch (err) {
    const store = readStore();
    return res.json(store.site_settings || {});
  }
});

app.get('/api/public/activities', async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT id,title,description,image_path,activity_date,location FROM activities WHERE status='published' ORDER BY COALESCE(activity_date,created_at) DESC LIMIT 12");
    return res.json(rows);
  } catch (err) {
    const store = readStore();
    const rows = (store.activities || [])
      .filter(a => a.status === 'published')
      .sort((a, b) => new Date(b.activity_date || b.created_at || 0) - new Date(a.activity_date || a.created_at || 0))
      .slice(0, 12);
    return res.json(rows);
  }
});

app.get('/api/public/news', async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT id,title,body,cover_image,event_date,location,published_at FROM news_posts WHERE status='published' ORDER BY COALESCE(published_at,created_at) DESC LIMIT 12");
    return res.json(rows);
  } catch (err) {
    const store = readStore();
    const rows = (store.news_posts || [])
      .filter(n => n.status === 'published')
      .sort((a, b) => new Date(b.event_date || b.published_at || b.created_at || 0) - new Date(a.event_date || a.published_at || a.created_at || 0))
      .slice(0, 12);
    return res.json(rows);
  }
});

app.get('/api/public/team', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id,name,designation,biography,image_path FROM team_members ORDER BY sort_order,id');
    return res.json(rows);
  } catch (err) {
    const store = readStore();
    return res.json(store.team_members || []);
  }
});

app.get('/api/public/gallery', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id,image_path,caption,category,event_date FROM gallery_images ORDER BY id DESC LIMIT 30');
    return res.json(rows);
  } catch (err) {
    const store = readStore();
    return res.json((store.gallery_images || []).slice(0, 30));
  }
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone = '', subject, message } = req.body || {};
  if (!name?.trim() || !subject?.trim() || !message?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ''))
    return res.status(400).json({ error: 'Enter your name, a valid email, subject, and message.' });
  if (String(message).length > 5000) return res.status(400).json({ error: 'Message is too long.' });

  try {
    await pool.execute('INSERT INTO contact_enquiries (name,email,phone,subject,message) VALUES (?,?,?,?,?)',
      [name.trim().slice(0, 160), email.trim().slice(0, 190), String(phone).slice(0, 30), subject.trim().slice(0, 220), message.trim()]);
    return res.status(201).json({ message: 'Thank you. Your enquiry has been sent to the trust.' });
  } catch (err) {
    const store = readStore();
    store.contact_enquiries = store.contact_enquiries || [];
    store.contact_enquiries.unshift({
      id: Date.now(),
      name: name.trim().slice(0, 160),
      email: email.trim().slice(0, 190),
      phone: String(phone).slice(0, 30),
      subject: subject.trim().slice(0, 220),
      message: message.trim(),
      status: 'new',
      created_at: new Date().toISOString()
    });
    writeStore(store);
    return res.status(201).json({ message: 'Thank you. Your enquiry has been sent to the trust.' });
  }
});

app.post('/api/volunteer', async (req, res) => {
  const { full_name, email, phone, district, interest, message = '', consent } = req.body || {};
  if (!full_name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '') || !phone?.trim() || !district?.trim() || !interest?.trim() || consent !== true)
    return res.status(400).json({ error: 'Complete all required fields and give consent before submitting.' });

  try {
    await pool.execute('INSERT INTO volunteer_applications (full_name,email,phone,district,interest,message,consent) VALUES (?,?,?,?,?,?,?)',
      [full_name.trim().slice(0, 160), email.trim().slice(0, 190), phone.trim().slice(0, 30), district.trim().slice(0, 120), interest.trim().slice(0, 180), String(message).slice(0, 3000), true]);
    return res.status(201).json({ message: 'Thank you for your interest. The trust can review your application.' });
  } catch (err) {
    const store = readStore();
    store.volunteer_applications = store.volunteer_applications || [];
    store.volunteer_applications.unshift({
      id: Date.now(),
      full_name: full_name.trim().slice(0, 160),
      email: email.trim().slice(0, 190),
      phone: phone.trim().slice(0, 30),
      district: district.trim().slice(0, 120),
      interest: interest.trim().slice(0, 180),
      message: String(message).slice(0, 3000),
      consent: true,
      status: 'new',
      created_at: new Date().toISOString()
    });
    writeStore(store);
    return res.status(201).json({ message: 'Thank you for your interest. The trust can review your application.' });
  }
});

app.post('/api/admin/login', loginLimiter, async (req, res) => {
  require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const [rows] = await pool.execute('SELECT id,email,password_hash,role FROM admins WHERE email=? LIMIT 1', [String(email).toLowerCase().trim()]);
    const admin = rows[0];
    if (admin && (await bcrypt.compare(String(password), admin.password_hash))) {
      const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, getSessionSecret(), { expiresIn: '8h' });
      res.cookie('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
      return res.json({ email: admin.email, role: admin.role });
    }
  } catch (dbErr) {
    console.warn('[Admin Auth] MySQL is offline, verifying credentials against environment settings.');
  }

  const defaultEmail = (process.env.ADMIN_EMAIL || 'ilangathirtrust@gmail.com').toLowerCase().trim();
  const defaultPass = process.env.ADMIN_PASSWORD || '1012';
  if (String(email).toLowerCase().trim() === defaultEmail && String(password) === defaultPass) {
    const token = jwt.sign({ id: 1, email: defaultEmail, role: 'admin' }, getSessionSecret(), { expiresIn: '8h' });
    res.cookie('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
    return res.json({ email: defaultEmail, role: 'admin' });
  }

  return res.status(401).json({ error: 'Invalid login details.' });
});

app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie('admin_token', { httpOnly: true, sameSite: 'strict' });
  res.json({ message: 'Signed out.' });
});

app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ email: req.admin.email, role: req.admin.role }));

app.get('/api/admin/summary', requireAdmin, async (_req, res) => {
  try {
    const queries = [
      ["activities", "SELECT COUNT(*) n FROM activities WHERE status='published'"],
      ["gallery", "SELECT COUNT(*) n FROM gallery_images"],
      ["news", "SELECT COUNT(*) n FROM news_posts WHERE status='published'"],
      ["upcoming", "SELECT COUNT(*) n FROM news_posts WHERE event_date>=CURDATE() AND status='published'"],
      ["enquiries", "SELECT COUNT(*) n FROM contact_enquiries WHERE status='new'"],
      ["volunteers", "SELECT COUNT(*) n FROM volunteer_applications WHERE status='new'"]
    ];
    const out = {};
    for (const [key, sql] of queries) { const [r] = await pool.query(sql); out[key] = r[0].n; }
    return res.json(out);
  } catch (err) {
    const store = readStore();
    const today = new Date().toISOString().slice(0, 10);
    return res.json({
      activities: (store.activities || []).filter(a => a.status === 'published').length,
      gallery: (store.gallery_images || []).length,
      news: (store.news_posts || []).filter(n => n.status === 'published').length,
      upcoming: (store.news_posts || []).filter(n => n.status === 'published' && (!n.event_date || n.event_date >= today)).length,
      enquiries: (store.contact_enquiries || []).filter(e => e.status === 'new').length,
      volunteers: (store.volunteer_applications || []).filter(v => v.status === 'new').length
    });
  }
});

app.get('/api/admin/:type', requireEditor, async (req, res) => {
  const type = req.params.type;
  try {
    if (['enquiries', 'volunteers'].includes(type)) {
      const table = type === 'enquiries' ? 'contact_enquiries' : 'volunteer_applications';
      const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 300`);
      return res.json(rows);
    }
    const spec = safeTable(type);
    const [rows] = await pool.query(`SELECT * FROM ${spec.table} ORDER BY id DESC LIMIT 300`);
    return res.json(rows);
  } catch (err) {
    const store = readStore();
    const key = storeKeyMap[type] || type;
    const items = (store[key] || []).slice().reverse();
    return res.json(items);
  }
});

app.post('/api/admin/upload', requireEditor, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    const file = req.files?.[0] || req.file;
    if (!file) return res.status(400).json({ error: 'Please choose an image file (JPG, PNG, or WEBP).' });
    res.status(201).json({ path: '/uploads/' + file.filename });
  });
});

app.post('/api/admin/:type', requireEditor, async (req, res) => {
  const type = req.params.type, data = req.body || {};
  const spec = safeTable(type);
  for (const f of spec.required) {
    if (data[f] === undefined || String(data[f]).trim() === '') {
      return res.status(400).json({ error: `${f.replaceAll('_', ' ')} is required.` });
    }
  }

  const fields = spec.fields.filter(f => data[f] !== undefined);
  if (!fields.length) return res.status(400).json({ error: 'No editable fields supplied.' });
  const vals = fields.map(f => data[f] === '' ? null : data[f]);

  try {
    const [result] = await pool.execute(`INSERT INTO ${spec.table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`, vals);
    return res.status(201).json({ id: result.insertId, message: 'Content created successfully.' });
  } catch (err) {
    const store = readStore();
    const key = storeKeyMap[type] || type;
    store[key] = store[key] || [];
    const newId = Date.now();
    const newRecord = { id: newId, created_at: new Date().toISOString() };
    fields.forEach(f => { newRecord[f] = data[f]; });
    store[key].push(newRecord);
    writeStore(store);
    return res.status(201).json({ id: newId, message: 'Content created successfully.' });
  }
});

app.put('/api/admin/:type/:id', requireEditor, async (req, res) => {
  const type = req.params.type, data = req.body || {}, id = Number(req.params.id);
  const spec = safeTable(type);
  const fields = spec.fields.filter(f => data[f] !== undefined);
  if (!fields.length) return res.status(400).json({ error: 'No editable fields supplied.' });

  try {
    await pool.execute(`UPDATE ${spec.table} SET ${fields.map(f => `${f}=?`).join(',')} WHERE id=?`, [...fields.map(f => data[f] === '' ? null : data[f]), id]);
    return res.json({ message: 'Content updated successfully.' });
  } catch (err) {
    const store = readStore();
    const key = storeKeyMap[type] || type;
    const items = store[key] || [];
    const idx = items.findIndex(r => Number(r.id) === id);
    if (idx !== -1) {
      fields.forEach(f => { items[idx][f] = data[f]; });
      items[idx].updated_at = new Date().toISOString();
      writeStore(store);
      return res.json({ message: 'Content updated successfully.' });
    }
    return res.status(404).json({ error: 'Item not found.' });
  }
});

app.delete('/api/admin/:type/:id', requireEditor, async (req, res) => {
  const type = req.params.type, id = Number(req.params.id);
  const spec = safeTable(type);
  try {
    await pool.execute(`DELETE FROM ${spec.table} WHERE id=?`, [id]);
    return res.json({ message: 'Content deleted.' });
  } catch (err) {
    const store = readStore();
    const key = storeKeyMap[type] || type;
    store[key] = (store[key] || []).filter(r => Number(r.id) !== id);
    writeStore(store);
    return res.json({ message: 'Content deleted.' });
  }
});

app.patch('/api/admin/:type/:id/status', requireEditor, async (req, res) => {
  const type = req.params.type, status = req.body.status, id = Number(req.params.id);
  if (['activities', 'news'].includes(type)) {
    if (!['draft', 'published'].includes(status)) return res.status(400).json({ error: 'Invalid publication status.' });
    const spec = safeTable(type);
    const extra = type === 'news' && status === 'published' ? ', published_at=COALESCE(published_at,NOW())' : '';
    try {
      await pool.execute(`UPDATE ${spec.table} SET status=?${extra} WHERE id=?`, [status, id]);
      return res.json({ message: 'Publication status updated.' });
    } catch (err) {
      const store = readStore();
      const key = storeKeyMap[type] || type;
      const items = store[key] || [];
      const item = items.find(r => Number(r.id) === id);
      if (item) {
        item.status = status;
        if (type === 'news' && status === 'published' && !item.published_at) {
          item.published_at = new Date().toISOString();
        }
        writeStore(store);
        return res.json({ message: 'Publication status updated.' });
      }
      return res.status(404).json({ error: 'Item not found.' });
    }
  }
  if (['enquiries', 'volunteers'].includes(type)) {
    const table = type === 'enquiries' ? 'contact_enquiries' : 'volunteer_applications';
    const allowed = type === 'enquiries' ? ['new', 'read', 'closed'] : ['new', 'reviewing', 'contacted', 'closed'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    try {
      await pool.execute(`UPDATE ${table} SET status=? WHERE id=?`, [status, id]);
      return res.json({ message: 'Status updated.' });
    } catch (err) {
      const store = readStore();
      const items = store[table] || [];
      const item = items.find(r => Number(r.id) === id);
      if (item) {
        item.status = status;
        writeStore(store);
        return res.json({ message: 'Status updated.' });
      }
      return res.status(404).json({ error: 'Item not found.' });
    }
  }
  return res.status(404).json({ error: 'Unknown status type.' });
});
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof multer.MulterError) return res.status(400).json({ error: 'Image upload failed. Check the file size and type.' });
  res.status(err.status || 500).json({ error: process.env.NODE_ENV === 'production' ? 'Something went wrong. Please try again.' : err.message || 'Server error.' });
});
async function initDatabase() {
  const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  };
  try {
    const conn = await mysql.createConnection(dbConfig);
    const dbName = process.env.DB_NAME || 'ilangathir_trust';
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.changeUser({ database: dbName });

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));
      for (const statement of statements) {
        try { await conn.query(statement); } catch { }
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword && adminPassword !== 'ChangeThisBeforeFirstRun!') {
      const hash = await bcrypt.hash(adminPassword, 12);
      await conn.execute(
        'INSERT INTO admins (email, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)',
        [adminEmail.toLowerCase().trim(), hash, 'admin']
      );
      console.log(`[Database] Admin account synced: ${adminEmail}`);
    }

    await conn.end();
    console.log(`[Database] Connected successfully to MySQL database "${dbName}".`);
  } catch (err) {
    console.warn(`[Database Notice] Could not connect to MySQL: ${err.message}`);
    console.warn('[Database Notice] If using XAMPP, open XAMPP Control Panel and start "MySQL".');
  }
}

app.listen(PORT, async () => {
  console.log(`Ilangathir Arakattalai website running at http://localhost:${PORT}`);
  await initDatabase();
});
