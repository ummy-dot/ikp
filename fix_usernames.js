require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixUsernames() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Populating usernames for existing users...');

        // Update Administrator
        const [res1] = await conn.execute(
            "UPDATE users SET username = 'admin' WHERE email = 'admin@ikp.rs' AND (username IS NULL OR username = '')"
        );
        console.log(`Updated Administrator: ${res1.affectedRows} row(s)`);

        // Update Perawat Sample
        const [res2] = await conn.execute(
            "UPDATE users SET username = 'user' WHERE email = 'user@ikp.rs' AND (username IS NULL OR username = '')"
        );
        console.log(`Updated Perawat Sample: ${res2.affectedRows} row(s)`);

        // Update Tester
        const [res3] = await conn.execute(
            "UPDATE users SET username = 'tester' WHERE email = 'tester@ikp.rs' AND (username IS NULL OR username = '')"
        );
        console.log(`Updated Tester: ${res3.affectedRows} row(s)`);

        console.log('✅ Usernames populated successfully!');
    } catch (err) {
        console.error('❌ Error updating usernames:', err.message);
    } finally {
        await conn.end();
    }
}

fixUsernames();
