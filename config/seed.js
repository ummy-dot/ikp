const db = require('../config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        // Create admin user
        const hash = await bcrypt.hash('admin123', 10);
        await db.execute(
            'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Administrator', 'admin@ikp.rs', hash, 'admin']
        );
        // Create sample user
        const userHash = await bcrypt.hash('user123', 10);
        await db.execute(
            'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Perawat Sample', 'user@ikp.rs', userHash, 'user']
        );
        console.log('✅ Seed selesai!');
        console.log('   Admin: admin@ikp.rs / admin123');
        console.log('   User:  user@ikp.rs  / user123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}
seed();
