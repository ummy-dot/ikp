// Middleware: only authenticated users
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) return next();
    req.flash('error', 'Silakan login terlebih dahulu.');
    res.redirect('/auth/login');
}

// Middleware: only admin
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') return next();
    res.status(403).render('error', {
        title: 'Akses Ditolak',
        message: 'Hanya admin yang dapat mengakses halaman ini.',
        user: req.session.user || null
    });
}

// Middleware: only user (non-admin)
function isUser(req, res, next) {
    if (req.session && req.session.user) return next();
    req.flash('error', 'Silakan login terlebih dahulu.');
    res.redirect('/auth/login');
}

module.exports = { isAuthenticated, isAdmin, isUser };
