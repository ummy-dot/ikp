require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  // Connect without database first (to create it)
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  const sql = `
    CREATE DATABASE IF NOT EXISTS ikp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    USE ikp_db;

    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE DEFAULT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tanggal_insiden DATE NOT NULL,
      waktu_insiden TIME NOT NULL,
      insiden TEXT NOT NULL,
      kronologis TEXT NOT NULL,
      jenis_insiden ENUM('KNC','KTC','KPC','KTD','SENTINEL') NOT NULL,
      pelapor_pertama VARCHAR(100) NOT NULL,
      insiden_terjadi_pada VARCHAR(255) NOT NULL,
      insiden_terjadi_lainnya VARCHAR(255),
      menyangkut_pasien VARCHAR(100) NOT NULL,
      menyangkut_lainnya VARCHAR(255),
      tempat_insiden VARCHAR(255) NOT NULL,
      spesialisasi VARCHAR(255) NOT NULL,
      spesialisasi_lainnya VARCHAR(255),
      unit_terkait VARCHAR(255) NOT NULL,
      akibat_insiden ENUM('Kematian','Cedera Irreversibel / Cedera Berat','Cedera Reversibel / Cedera Sedang','Cedera Ringan','Tidak ada cedera') NOT NULL,
      tindakan_segera TEXT NOT NULL,
      tindakan_oleh VARCHAR(100) NOT NULL,
      tindakan_lainnya VARCHAR(255),
      kejadian_serupa VARCHAR(10) DEFAULT NULL,
      detail_serupa TEXT,
      pembuat_laporan_file VARCHAR(255),
      tanda_tangan LONGTEXT,
      grading_risiko ENUM('Biru','Hijau','Kuning','Merah') NOT NULL,
      status ENUM('pending','reviewed') DEFAULT 'pending',
      is_final BOOLEAN NOT NULL DEFAULT 0,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS patient_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      incident_id INT NOT NULL,
      nama_pasien VARCHAR(255) NOT NULL,
      no_rekam_medik VARCHAR(50) NOT NULL,
      ruangan VARCHAR(100),
      kelompok_umur ENUM('0-1 bulan','> 1 bulan - 1 tahun','> 1 tahun - 5 tahun','> 5 tahun - 15 tahun','> 15 tahun - 30 tahun','> 30 tahun - 65 tahun','> 65 tahun') NOT NULL,
      jenis_kelamin ENUM('Laki-laki','Perempuan') NOT NULL,
      penanggung_biaya VARCHAR(100) NOT NULL,
      alamat TEXT,
      tanggal_lahir DATE,
      tanggal_masuk DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
    );
  `;

  try {
    await conn.query(sql);
    // Jika tabel users sudah ada di DB lama, coba tambahkan kolom username dan buat email nullable
    try {
      await conn.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE");
      await conn.query("ALTER TABLE users MODIFY email VARCHAR(255) DEFAULT NULL");
      await conn.query("ALTER TABLE incidents ADD COLUMN IF NOT EXISTS is_final BOOLEAN NOT NULL DEFAULT 0");
      await conn.query("ALTER TABLE patient_data ADD COLUMN IF NOT EXISTS alamat TEXT");
      await conn.query("ALTER TABLE patient_data ADD COLUMN IF NOT EXISTS tanggal_lahir DATE");
    } catch (e) {
      // Abaikan jika ALTER tidak didukung pada versi MySQL lama
    }

    console.log('✅ Database dan tabel berhasil dibuat/diupdate!');
    await conn.end();

    // Now seed users
    const bcrypt = require('bcryptjs');
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: 'ikp_db'
    });

    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('user123', 10);

    await db.execute(
      'INSERT IGNORE INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      ['Administrator', 'admin', 'admin@ikp.rs', adminHash, 'admin']
    );
    await db.execute(
      'INSERT IGNORE INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      ['Perawat Sample', 'user', 'user@ikp.rs', userHash, 'user']
    );
    await db.end();

    console.log('✅ Akun default berhasil dibuat:');
    console.log('   📧 Admin: admin@ikp.rs    🔑 admin123');
    console.log('   📧 User:  user@ikp.rs     🔑 user123');
    console.log('\n🚀 Jalankan: npm start');
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Tip: Ubah DB_PASSWORD di file .env jika MySQL Anda memiliki password');
    }
    process.exit(1);
  }
}
migrate();
