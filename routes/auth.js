const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// GET /auth/login
router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect(req.session.user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    }
    res.render('auth/login', {
        title: 'Login - IKP',
        error: req.flash('error'),
        success: req.flash('success')
    });
});

// POST /auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('[AUTH] Login attempt for username/email:', username);
    try {
        // Search for user by username only
        [rows] = await db.execute('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);

        if (!rows || rows.length === 0) {
            req.flash('error', 'Username atau password salah.');
            return res.redirect('/auth/login');
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            req.flash('error', 'Username atau password salah.');
            return res.redirect('/auth/login');
        }

        req.session.user = { id: user.id, name: user.name, username: user.username || user.email, role: user.role };
        if (user.role === 'admin') return res.redirect('/admin/dashboard');
        return res.redirect('/user/dashboard');
    } catch (err) {
        console.error('Login error:', err && err.stack ? err.stack : err);
        req.flash('error', 'Terjadi kesalahan server.');
        res.redirect('/auth/login');
    }
});

// GET /auth/register
router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Daftar Akun - IKP',
        error: req.flash('error'),
        success: req.flash('success')
    });
});

// POST /auth/register
router.post('/register', async (req, res) => {
    const { name, username, password, password_confirm } = req.body;
    if (password !== password_confirm) {
        req.flash('error', 'Password tidak cocok.');
        return res.redirect('/auth/register');
    }
    try {
        const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
        if (existing.length > 0) {
            req.flash('error', 'Username sudah terdaftar.');
            return res.redirect('/auth/register');
        }
        const hash = await bcrypt.hash(password, 10);
        await db.execute('INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, username, null, hash, 'user']);
        req.flash('success', 'Akun berhasil dibuat. Silakan login.');
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Terjadi kesalahan server.');
        res.redirect('/auth/register');
    }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/auth/login');
    });
});

module.exports = router;
