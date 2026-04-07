const db = require('./config/db');
(async () => {
  try {
    const [rows] = await db.execute('SELECT id, no_rekam_medik, jenis_kelamin FROM patient_data');
    console.log(rows);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
})();