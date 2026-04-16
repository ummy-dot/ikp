const mysql = require('mysql2/promise');

async function testDB() {
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'ikp_db'
    });

    try {
        console.log('Testing direct INSERT...');
        const [res] = await db.execute(
            'INSERT INTO incidents (pelapor_pertama, pelapor_pertama_lainnya, insiden) VALUES (?, ?, ?)',
            ['Lainnya', 'DIRECT_DB_TEST_VALUE', 'Test Insiden']
        );
        const id = res.insertId;
        console.log('Inserted ID:', id);

        const [rows] = await db.execute('SELECT pelapor_pertama_lainnya FROM incidents WHERE id = ?', [id]);
        console.log('Value in DB:', rows[0].pelapor_pertama_lainnya);
        
        await db.end();
    } catch (err) {
        console.error('DB Error:', err.message);
    }
}

testDB();
