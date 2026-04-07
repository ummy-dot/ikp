const mysql = require('mysql2/promise');

async function checkDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'ikp_db'
    });

    try {
        // Check patient_data table
        console.log('\n=== PATIENT_DATA TABLE ===');
        const [rows] = await connection.execute('SELECT id, incident_id, nama_pasien, no_rekam_medik, kelompok_umur, jenis_kelamin FROM patient_data ORDER BY id DESC LIMIT 10');
        
        if (rows.length === 0) {
            console.log('⚠️  PATIENT_DATA TABLE IS EMPTY!');
        } else {
            console.log(`Found ${rows.length} records:`);
            rows.forEach(row => {
                console.log(`  ID ${row.id}: Incident ${row.incident_id}, RM ${row.no_rekam_medik}, ${row.nama_pasien}`);
                console.log(`    Kelompok Umur: "${row.kelompok_umur}"`);
                console.log(`    Jenis Kelamin: "${row.jenis_kelamin}"`);
            });
        }

        // Check incidents table
        console.log('\n=== INCIDENTS TABLE (LATEST) ===');
        const [incidents] = await connection.execute('SELECT id, insiden, kelompok_umur, jenis_kelamin, created_by, created_at FROM incidents ORDER BY id DESC LIMIT 5');
        
        incidents.forEach(inc => {
            console.log(`  ID ${inc.id}: "${inc.insiden.substring(0, 50)}..."`);
            console.log(`    Kelompok Umur: "${inc.kelompok_umur}"`);
            console.log(`    Jenis Kelamin: "${inc.jenis_kelamin}"`);
        });

    } finally {
        await connection.end();
    }
}

checkDatabase().catch(console.error);
