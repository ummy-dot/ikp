const db = require('./config/db');

async function updateSchema() {
    try {
        console.log('Running ALTER statements to relax constraints...');
        
        const alterIncidents = [
            "ALTER TABLE incidents MODIFY tanggal_insiden DATE DEFAULT NULL",
            "ALTER TABLE incidents MODIFY waktu_insiden TIME DEFAULT NULL",
            "ALTER TABLE incidents MODIFY insiden TEXT DEFAULT NULL",
            "ALTER TABLE incidents MODIFY kronologis TEXT DEFAULT NULL",
            "ALTER TABLE incidents MODIFY jenis_insiden ENUM('KNC','KTC','KPC','KTD','SENTINEL') DEFAULT NULL",
            "ALTER TABLE incidents MODIFY pelapor_pertama VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE incidents MODIFY insiden_terjadi_pada VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE incidents MODIFY menyangkut_pasien VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE incidents MODIFY tempat_insiden VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE incidents MODIFY spesialisasi VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE incidents MODIFY unit_terkait VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE incidents MODIFY akibat_insiden ENUM('Kematian','Cedera Irreversibel / Cedera Berat','Cedera Reversibel / Cedera Sedang','Cedera Ringan','Tidak ada cedera') DEFAULT NULL",
            "ALTER TABLE incidents MODIFY tindakan_segera TEXT DEFAULT NULL",
            "ALTER TABLE incidents MODIFY tindakan_oleh VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE incidents MODIFY kejadian_serupa VARCHAR(10) DEFAULT NULL",
            "ALTER TABLE incidents MODIFY is_final BOOLEAN DEFAULT 0",
            "ALTER TABLE incidents MODIFY grading_risiko ENUM('Biru','Hijau','Kuning','Merah') NOT NULL DEFAULT 'Biru'",
            "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS pelapor_pertama_lainnya VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS insiden_terjadi_lainnya VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS menyangkut_lainnya VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS spesialisasi_lainnya VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS tindakan_lainnya VARCHAR(255) DEFAULT NULL"
        ];

        const alterPatientData = [
            "ALTER TABLE patient_data MODIFY nama_pasien VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE patient_data MODIFY no_rekam_medik VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE patient_data MODIFY kelompok_umur ENUM('0-1 bulan','> 1 bulan - 1 tahun','> 1 tahun - 5 tahun','> 5 tahun - 15 tahun','> 15 tahun - 30 tahun','> 30 tahun - 65 tahun','> 65 tahun') DEFAULT NULL",
            "ALTER TABLE patient_data MODIFY jenis_kelamin ENUM('Laki-laki','Perempuan') DEFAULT NULL",
            "ALTER TABLE patient_data MODIFY penanggung_biaya VARCHAR(100) DEFAULT NULL",
            "ALTER TABLE patient_data MODIFY tanggal_masuk DATETIME DEFAULT NULL"
        ];

        for (const sql of alterIncidents) {
            console.log(`Executing: ${sql}`);
            await db.execute(sql).catch(e => console.error(`Failed: ${sql}`, e.message));
        }

        for (const sql of alterPatientData) {
            console.log(`Executing: ${sql}`);
            await db.execute(sql).catch(e => console.error(`Failed: ${sql}`, e.message));
        }

        console.log('Schema update completed.');
    } catch (err) {
        console.error('Schema update failed:', err);
    } finally {
        process.exit();
    }
}

updateSchema();
