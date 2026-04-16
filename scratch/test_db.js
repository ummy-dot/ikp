const db = require('./backend/config/db');

async function testInsert() {
    try {
        console.log('Testing insert with empty strings...');
        // Try to insert with empty strings for NOT NULL columns
        const [result] = await db.execute(`
            INSERT INTO incidents (
                tanggal_insiden, waktu_insiden, insiden, kronologis, jenis_insiden,
                pelapor_pertama, insiden_terjadi_pada, insiden_terjadi_lainnya,
                menyangkut_pasien, menyangkut_lainnya, tempat_insiden,
                spesialisasi, spesialisasi_lainnya, unit_terkait, akibat_insiden,
                tindakan_segera, tindakan_oleh, tindakan_lainnya,
                kejadian_serupa, detail_serupa, pembuat_laporan_file, tanda_tangan,
                grading_risiko, created_by, is_final
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `, [
            '', '', '', '', '',
            '', '', '',
            '', '', '',
            '', '', '', '',
            '', '', '',
            0, '', null, '',
            'Biru', 1, 0
        ]);
        console.log('Insert success:', result.insertId);
    } catch (err) {
        console.error('Insert failed with error:', err.code, err.message);
    } finally {
        process.exit();
    }
}

testInsert();
