require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
(async () => {
    const email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password === 'ChangeThisBeforeFirstRun!') throw new Error('Set a real ADMIN_EMAIL and ADMIN_PASSWORD in .env before creating the admin.');
    const db = await mysql.createConnection({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'ilangathir_trust' });
    const hash = await bcrypt.hash(password, 12);
    await db.execute('INSERT INTO admins(email,password_hash,role) VALUES(?,?,?) ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash)', [email.toLowerCase().trim(), hash, 'admin']);
    console.log('Admin account created/updated for ' + email + '. Keep your password private.');
    await db.end();
})().catch(e => { console.error(e.message); process.exit(1) });
