const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'ikp_secret_jwt';

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('[API AUTH] Login attempt for username:', username);
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);

        if (!rows || rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, name: user.name, username: user.username || user.email, role: user.role },
            SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            success: true, 
            message: 'Login berhasil.', 
            token, 
            user: { id: user.id, name: user.name, username: user.username, role: user.role } 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, username, password, password_confirm } = req.body;
    if (password !== password_confirm) {
        return res.status(400).json({ success: false, message: 'Password tidak cocok.' });
    }
    try {
        const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Username sudah terdaftar.' });
        }
        const hash = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, username, null, hash, 'user']);
        
        res.status(201).json({ success: true, message: 'Akun berhasil dibuat. Silakan login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// GET /api/auth/verify (for frontend to check if token is still valid and get user info)
router.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Token tidak ada.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET);
        res.json({ success: true, user: decoded });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Token tidak valid.' });
    }
});

// (Logout is handled on frontend by clearing the token)

module.exports = router;
