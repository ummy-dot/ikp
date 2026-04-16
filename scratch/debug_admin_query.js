const mysql = require('mysql2/promise');

async function debugQuery() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '123', // I recall it was 123456 or 123?
        database: 'ikp_db'
    }).catch(() => mysql.createConnection({ host: 'localhost', user: 'root', password: '123456', database: 'ikp_db' }));

    try {
        const query = `
            SELECT i.*, u.name as pelapor_name, 
                   p.nama_pasien, p.no_rekam_medik, p.ruangan, p.kelompok_umur, 
                   p.jenis_kelamin, p.penanggung_biaya, p.tanggal_masuk, p.tanggal_lahir
            FROM incidents i 
            LEFT JOIN users u ON i.created_by = u.id 
            LEFT JOIN patient_data p ON i.id = p.incident_id
            ORDER BY i.created_at DESC LIMIT 1
        `;

        const [rows] = await connection.execute(query);
        console.log("DEBUG ROW[0] KEYS:", Object.keys(rows[0]));
        console.log("DEBUG ROW[0] VALUES:", rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}
debugQuery();
