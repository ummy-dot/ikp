const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET = process.env.JWT_SECRET || 'ikp_secret_jwt';

// Middleware: only authenticated users
function isAuthenticated(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ada atau tidak valid.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded; // Store user payload
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kadaluarsa.' });
    }
}

// Middleware: only admin
function isAdmin(req, res, next) {
    isAuthenticated(req, res, () => {
        if (req.user && req.user.role === 'admin') {
            return next();
        }
        return res.status(403).json({ success: false, message: 'Akses ditolak. Memerlukan hak akses Admin (Admin).' });
    });
}

// Middleware: only user (non-admin)
function isUser(req, res, next) {
    isAuthenticated(req, res, () => {
        return next();
    });
}

module.exports = { isAuthenticated, isAdmin, isUser };
