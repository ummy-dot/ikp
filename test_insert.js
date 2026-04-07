const db = require('./config/db');

async function testInsert() {
  try {
    const [result] = await db.execute(`
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
    console.log('Insert berhasil, ID:', result.insertId);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
}
testInsert();