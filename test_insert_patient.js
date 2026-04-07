const db = require('./config/db');

(async () => {
  try {
    const conn = await db.getConnection();
    await conn.beginTransaction();
    const [result] = await conn.execute(`
      INSERT INTO incidents (
        tanggal_insiden, waktu_insiden, insiden, kronologis, jenis_insiden,
        pelapor_pertama, insiden_terjadi_pada, menyangkut_pasien, tempat_insiden,
        spesialisasi, unit_terkait, akibat_insiden, tindakan_segera, tindakan_oleh,
        kejadian_serupa, grading_risiko, created_by, is_final
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      '2026-03-11', '10:00', 'Test insiden', 'Test kronologis', 'KNC',
      'Test pelapor', 'Test terjadi pada', 'Test pasien', 'Test tempat',
      'Test spesialisasi', 'Test unit', 'Tidak ada cedera', 'Test tindakan', 'Test oleh',
      0, 'Biru', 2, 0
    ]);
    const incidentId = result.insertId;
    await conn.execute(`
      INSERT INTO patient_data
      (incident_id, nama_pasien, no_rekam_medik, tanggal_lahir, kelompok_umur, jenis_kelamin, alamat, ruangan, penanggung_biaya, tanggal_masuk)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      incidentId, 'Test Pasien', '123456', '1990-01-01', '> 30 tahun - 65 tahun', 'L', 'Test Alamat', 'Test Ruangan', 'BPJS', '2026-03-11 10:00:00'
    ]);
    await conn.commit();
    conn.release();
    console.log('Insert dengan patient berhasil, ID:', incidentId);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
})();