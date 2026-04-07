require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function verifyLogin() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- VERIFYING LOGIN LOGIC ---');

        const testCases = [
            { label: 'Admin Username', input: 'admin', password: 'admin123' },
            { label: 'Admin Email', input: 'admin@ikp.rs', password: 'admin123' },
            { label: 'User Username', input: 'user', password: 'user123' },
            { label: 'User Email', input: 'user@ikp.rs', password: 'user123' }
        ];

        for (const test of testCases) {
            process.stdout.write(`Testing ${test.label}... `);
            const [rows] = await conn.execute('SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1', [test.input, test.input]);
            
            if (rows.length === 0) {
                console.log('❌ FAILED (User not found)');
                continue;
            }

            const user = rows[0];
            const match = await bcrypt.compare(test.password, user.password);
            
            if (match) {
                console.log('✅ PASSED');
            } else {
                console.log('❌ FAILED (Password mismatch)');
            }
        }

    } catch (err) {
        console.error('\n❌ Error during verification:', err.message);
    } finally {
        await conn.end();
    }
}

verifyLogin();
