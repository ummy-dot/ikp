const db = require('./config/db');
(async () => {
  try {
    const [rows] = await db.execute('SELECT id, no_rekam_medik FROM patient_data WHERE jenis_kelamin = "" OR jenis_kelamin IS NULL');
    console.log('Rows needing update:', rows);
    for (const r of rows) {
      const gender = r.no_rekam_medik === '001234' ? 'L' : 'P';
      await db.execute('UPDATE patient_data SET jenis_kelamin=? WHERE id=?', [gender, r.id]);
      console.log('Updated', r.no_rekam_medik, '->', gender);
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
})();