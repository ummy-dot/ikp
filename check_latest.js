const mysql = require('mysql2/promise');

async function checkLatestData() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'ikp_db'
    });

    try {
        const [rows] = await connection.execute(`
            SELECT id, incident_id, nama_pasien, no_rekam_medik, kelompok_umur, jenis_kelamin 
            FROM patient_data 
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        console.log('=== Latest Patient Data ===');
        if (rows.length === 0) {
            console.log('(No data - wait for form submission)');
        } else {
            rows.forEach(row => {
                console.log(`ID ${row.id}: ${row.nama_pasien} (RM ${row.no_rekam_medik})`);
                console.log(`  Kelompok Umur: "${row.kelompok_umur}"`);
                console.log(`  Jenis Kelamin: "${row.jenis_kelamin}"`);
            });
        }

    } finally {
        await connection.end();
    }
}

checkLatestData().catch(console.error);
