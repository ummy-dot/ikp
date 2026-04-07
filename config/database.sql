-- Database Setup for Sistem Laporan IKP
CREATE DATABASE IF NOT EXISTS ikp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ikp_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE DEFAULT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incidents table
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
  kejadian_serupa BOOLEAN NOT NULL DEFAULT 0,
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

-- Patient data table (filled by admin)
CREATE TABLE IF NOT EXISTS patient_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  incident_id INT NOT NULL,
  nama_pasien VARCHAR(255) NOT NULL,
  no_rekam_medik VARCHAR(50) NOT NULL,
  ruangan VARCHAR(100),
  kelompok_umur ENUM('0-1 bulan','> 1 bulan - 1 tahun','> 1 tahun - 5 tahun','> 5 tahun - 15 tahun','> 15 tahun - 30 tahun','> 30 tahun - 65 tahun','> 65 tahun') NOT NULL,
  jenis_kelamin ENUM('Laki-laki','Perempuan') NOT NULL,
  penanggung_biaya VARCHAR(100) NOT NULL,
  tanggal_masuk DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

-- Default admin user (password: admin123)
INSERT IGNORE INTO users (name, username, email, password, role) VALUES 
('Administrator', 'admin', 'admin@ikp.rs', '$2b$10$rQnm9m8bQ6z3D9v1Z5Xy0.q0q5BK5kn5E9N2Q0p7p7j8R1s5L5a9K', 'admin');
