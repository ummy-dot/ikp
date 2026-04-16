const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// File upload config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'laporan-' + unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// ==================== USER DASHBOARD ====================
// GET /api/user/dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                DATE_FORMAT(i.created_at, '%Y-%m') as bulan,
                COUNT(*) as jumlah
            FROM incidents i
            WHERE i.created_by = ?
            GROUP BY DATE_FORMAT(i.created_at, '%Y-%m')
            ORDER BY bulan ASC
        `;
        
        const [monthlyData] = await db.execute(query, [userId]);
        
        const chartData = {
            labels: monthlyData.map(d => d.bulan),
            data: monthlyData.map(d => d.jumlah)
        };
        
        const [totalStats] = await db.execute(
            'SELECT COUNT(*) as total, MAX(created_at) as last_report FROM incidents WHERE created_by = ?',
            [userId]
        );
        
        res.json({
            success: true,
            data: {
                chartData,
                totalReports: totalStats[0].total,
                lastReport: totalStats[0].last_report
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error loading dashboard data' });
    }
});

// ==================== LOOKUP SIMGOS ====================
router.post('/lookup-patient', isAuthenticated, async (req, res) => {
    try {
        const { no_rekam_medik } = req.body;
        if (!no_rekam_medik) {
            return res.status(400).json({ success: false, message: 'Nomor Rekam Medik harus diisi' });
        }

        const mockPatientData = {
            '001234': { nama: 'Budi Santoso', no_rm: '001234', ruangan: 'Mawar 2', kelompok_umur: '> 30 tahun - 65 tahun', jenis_kelamin: 'Laki-laki', penanggung_biaya: 'BPJS', tanggal_masuk: '2026-03-01T08:00', tanggal_lahir: '1990-05-15', alamat: 'Jl. Merdeka No. 1, Jakarta' },
            '005678': { nama: 'Siti Rahayu', no_rm: '005678', ruangan: 'Melati 1', kelompok_umur: '> 15 tahun - 30 tahun', jenis_kelamin: 'Perempuan', penanggung_biaya: 'Pribadi', tanggal_masuk: '2026-03-03T10:30', tanggal_lahir: '2000-08-20', alamat: 'Jl. Sudirman No. 10, Bandung' },
            '009999': { nama: 'Ahmad Fauzi', no_rm: '009999', ruangan: 'ICU', kelompok_umur: '> 65 tahun', jenis_kelamin: 'Laki-laki', penanggung_biaya: 'Asuransi Swasta', tanggal_masuk: '2026-02-28T14:00', tanggal_lahir: '1955-03-10', alamat: 'Jl. Gatot Subroto No. 5, Surabaya' },
            '112233': { nama: 'Dewi Lestari', no_rm: '112233', ruangan: 'VK / Bersalin', kelompok_umur: '> 15 tahun - 30 tahun', jenis_kelamin: 'Perempuan', penanggung_biaya: 'BPJS', tanggal_masuk: '2026-03-05T06:00', tanggal_lahir: '1995-12-03', alamat: 'Jl. Diponegoro No. 22, Yogyakarta' },
            '123456': { nama: 'Test Pasien', no_rm: '123456', ruangan: 'Test Ruangan', kelompok_umur: '> 30 tahun - 65 tahun', jenis_kelamin: 'Perempuan', penanggung_biaya: 'BPJS', tanggal_masuk: '2026-03-10T08:00', tanggal_lahir: '1989-12-30', alamat: 'Test Alamat' }
        };

        const patientData = mockPatientData[no_rekam_medik];

        if (patientData) {
            const birthDate = new Date(patientData.tanggal_lahir);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

            let kelompokUmur = '';
            if (age <= 1 && age === 0) kelompokUmur = '0-1 bulan';
            else if (age < 1) kelompokUmur = '> 1 bulan - 1 tahun';
            else if (age <= 5) kelompokUmur = '> 1 tahun - 5 tahun';
            else if (age <= 15) kelompokUmur = '> 5 tahun - 15 tahun';
            else if (age <= 30) kelompokUmur = '> 15 tahun - 30 tahun';
            else if (age <= 65) kelompokUmur = '> 30 tahun - 65 tahun';
            else kelompokUmur = '> 65 tahun';

            res.json({
                success: true,
                data: {
                    nama_pasien: patientData.nama,
                    no_rekam_medik: patientData.no_rm,
                    tanggal_lahir: patientData.tanggal_lahir,
                    kelompok_umur: kelompokUmur,
                    jenis_kelamin: patientData.jenis_kelamin,
                    alamat: patientData.alamat,
                    ruangan: patientData.ruangan,
                    penanggung_biaya: patientData.penanggung_biaya,
                    tanggal_masuk: patientData.tanggal_masuk,
                    umur: age
                }
            });
        } else {
            const [rows] = await db.execute('SELECT * FROM patient_data WHERE no_rekam_medik = ? LIMIT 1', [no_rekam_medik]);
            if (rows.length > 0) {
                const p = rows[0];
                res.json({ success: true, data: p });
            } else {
                res.json({ success: false, message: 'Data pasien tidak ditemukan' });
            }
        }
    } catch (error) {
        console.error('Error looking up patient:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat lookup data pasien' });
    }
});

// ==================== INCIDENTS ====================
// GET /api/user/incidents (Riwayat)
router.get('/incidents', isAuthenticated, async (req, res) => {
    try {
        const [incidents] = await db.execute(
            'SELECT *, DATE(created_at) as date_only FROM incidents WHERE created_by = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        const todayDate = new Date().toLocaleDateString('en-CA');
        const processed = incidents.map(i => {
            const createdDate = new Date(i.created_at).toLocaleDateString('en-CA');
            i.is_today = (createdDate === todayDate);
            return i;
        });

        res.json({ success: true, data: processed });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error loading incidents' });
    }
});

// GET /api/user/incidents/:id
router.get('/incidents/:id', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM incidents WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });

        const incident = rows[0];
        const [pRows] = await db.execute('SELECT * FROM patient_data WHERE incident_id = ?', [req.params.id]);
        
        res.json({ success: true, data: { incident, patient: pRows[0] || null } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error loading incident' });
    }
});

// POST /api/user/incidents (New or Update)
router.post('/incidents', isAuthenticated, upload.single('pembuat_laporan_file'), async (req, res) => {
    const {
        id, // for update
        tanggal_insiden, waktu_insiden, insiden, kronologis, jenis_insiden,
        pelapor_pertama, pelapor_pertama_lainnya, insiden_terjadi_pada, insiden_terjadi_lainnya,
        menyangkut_pasien, menyangkut_lainnya, tempat_insiden,
        spesialisasi, spesialisasi_lainnya, unit_terkait, akibat_insiden,
        tindakan_segera, tindakan_oleh, tindakan_lainnya,
        kejadian_serupa, detail_serupa, tanda_tangan, grading_risiko,
        submit_type,
        patient_nama, patient_no_rm, patient_tgl_lahir,
        patient_kelompok_umur, patient_jk, patient_alamat,
        patient_ruangan, patient_penanggung_biaya, patient_tanggal_masuk
    } = req.body;

    const pembuat_laporan_file = req.file ? req.file.filename : null;
    const serupaVal = kejadian_serupa === 'ya' || kejadian_serupa === 1 ? 1 : 0;
    const is_final = submit_type === 'final' ? 1 : 0;

    // Helper to convert empty strings to null for DB
    const toNull = (val) => (val === '' || val === undefined) ? null : val;

    const data = {
        tanggal_insiden: toNull(tanggal_insiden),
        waktu_insiden: toNull(waktu_insiden),
        insiden: toNull(insiden),
        kronologis: toNull(kronologis),
        jenis_insiden: toNull(jenis_insiden),
        pelapor_pertama: toNull(pelapor_pertama),
        pelapor_pertama_lainnya: toNull(pelapor_pertama_lainnya),
        insiden_terjadi_pada: toNull(insiden_terjadi_pada),
        insiden_terjadi_lainnya: toNull(insiden_terjadi_lainnya),
        menyangkut_pasien: toNull(menyangkut_pasien),
        menyangkut_lainnya: toNull(menyangkut_lainnya),
        tempat_insiden: toNull(tempat_insiden),
        spesialisasi: toNull(spesialisasi),
        spesialisasi_lainnya: toNull(spesialisasi_lainnya),
        unit_terkait: toNull(unit_terkait),
        akibat_insiden: toNull(akibat_insiden),
        tindakan_segera: toNull(tindakan_segera),
        tindakan_oleh: toNull(tindakan_oleh),
        tindakan_lainnya: toNull(tindakan_lainnya),
        detail_serupa: toNull(detail_serupa),
        grading_risiko: toNull(grading_risiko) || 'Biru',
        tanda_tangan: toNull(tanda_tangan)
    };

    try {
        console.log(`[DB DEBUG] Starting submission (ID: ${id || 'NEW'}, Type: ${submit_type})`);
        if (id) {
            // UPDATE
            console.log(`[DB DEBUG] Fetching existing incident ${id}`);
            const [rows] = await db.execute('SELECT * FROM incidents WHERE id = ? AND created_by = ?', [id, req.user.id]);
            console.log(`[DB DEBUG] Found ${rows.length} rows`);
            if (rows.length === 0) return res.status(403).json({ success: false, message: 'Tidak diizinkan atau tidak ditemukan' });

            const existing = rows[0];
            if (existing.is_final) return res.status(400).json({ success: false, message: 'Laporan sudah final dan tidak dapat diubah' });

            let sqlArr = [
                'tanggal_insiden=?', 'waktu_insiden=?', 'insiden=?', 'kronologis=?', 'jenis_insiden=?',
                'pelapor_pertama=?', 'pelapor_pertama_lainnya=?', 'insiden_terjadi_pada=?', 'insiden_terjadi_lainnya=?',
                'menyangkut_pasien=?', 'menyangkut_lainnya=?', 'tempat_insiden=?',
                'spesialisasi=?', 'spesialisasi_lainnya=?', 'unit_terkait=?', 'akibat_insiden=?',
                'tindakan_segera=?', 'tindakan_oleh=?', 'tindakan_lainnya=?',
                'kejadian_serupa=?', 'detail_serupa=?', 'is_final=?', 'grading_risiko=?'
            ];
            const params = [
                data.tanggal_insiden, data.waktu_insiden, data.insiden, data.kronologis, data.jenis_insiden,
                data.pelapor_pertama, data.pelapor_pertama_lainnya, data.insiden_terjadi_pada, data.insiden_terjadi_lainnya,
                data.menyangkut_pasien, data.menyangkut_lainnya, data.tempat_insiden,
                data.spesialisasi, data.spesialisasi_lainnya, data.unit_terkait, data.akibat_insiden,
                data.tindakan_segera, data.tindakan_oleh, data.tindakan_lainnya,
                serupaVal, data.detail_serupa, is_final, data.grading_risiko
            ];

            if (pembuat_laporan_file) { sqlArr.push('pembuat_laporan_file=?'); params.push(pembuat_laporan_file); }
            if (data.tanda_tangan) { sqlArr.push('tanda_tangan=?'); params.push(data.tanda_tangan); }

            params.push(id);
            console.log(`[DB DEBUG] Executing update for incident ${id}`);
            await db.execute(`UPDATE incidents SET ${sqlArr.join(', ')} WHERE id=?`, params);
            console.log(`[DB DEBUG] Update successful`);

            if (patient_no_rm || patient_nama || patient_ruangan) {
                console.log(`[DB DEBUG] Updating patient data for incident ${id}`);
                const jk = (patient_jk === 'L' || patient_jk === 'Laki-laki') ? 'Laki-laki' : (patient_jk === 'P' || patient_jk === 'Perempuan' ? 'Perempuan' : null);
                await db.execute(
                    `UPDATE patient_data SET nama_pasien=?, no_rekam_medik=?, tanggal_lahir=?, kelompok_umur=?, jenis_kelamin=?, alamat=?, ruangan=?, penanggung_biaya=?, tanggal_masuk=? WHERE incident_id=?`,
                    [toNull(patient_nama), toNull(patient_no_rm), toNull(patient_tgl_lahir), toNull(patient_kelompok_umur), jk, toNull(patient_alamat), toNull(patient_ruangan), toNull(patient_penanggung_biaya), toNull(patient_tanggal_masuk), id]
                );
                console.log(`[DB DEBUG] Patient update successful`);
            }
            res.json({ success: true, message: is_final ? 'Laporan terkirim' : 'Draft diperbarui' });
        } else {
            // CREATE
            const [result] = await db.execute(`
                INSERT INTO incidents (
                    tanggal_insiden, waktu_insiden, insiden, kronologis, jenis_insiden,
                    pelapor_pertama, pelapor_pertama_lainnya, insiden_terjadi_pada, insiden_terjadi_lainnya,
                    menyangkut_pasien, menyangkut_lainnya, tempat_insiden,
                    spesialisasi, spesialisasi_lainnya, unit_terkait, akibat_insiden,
                    tindakan_segera, tindakan_oleh, tindakan_lainnya,
                    kejadian_serupa, detail_serupa, pembuat_laporan_file, tanda_tangan,
                    grading_risiko, created_by, is_final
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                data.tanggal_insiden, data.waktu_insiden, data.insiden, data.kronologis, data.jenis_insiden,
                data.pelapor_pertama, data.pelapor_pertama_lainnya, data.insiden_terjadi_pada, data.insiden_terjadi_lainnya,
                data.menyangkut_pasien, data.menyangkut_lainnya, data.tempat_insiden,
                data.spesialisasi, data.spesialisasi_lainnya, data.unit_terkait, data.akibat_insiden,
                data.tindakan_segera, data.tindakan_oleh, data.tindakan_lainnya,
                serupaVal, data.detail_serupa, pembuat_laporan_file, data.tanda_tangan,
                data.grading_risiko, req.user.id, is_final
            ]);
            console.log(`[DB DEBUG] Insert successful, new ID: ${result.insertId}`);

            const incidentId = result.insertId;
            if (patient_no_rm || patient_nama || patient_ruangan) {
                console.log(`[DB DEBUG] Inserting patient data for new incident ${incidentId}`);
                const jk = (patient_jk === 'L' || patient_jk === 'Laki-laki') ? 'Laki-laki' : (patient_jk === 'P' || patient_jk === 'Perempuan' ? 'Perempuan' : null);
                await db.execute(
                    `INSERT INTO patient_data (incident_id, nama_pasien, no_rekam_medik, tanggal_lahir, kelompok_umur, jenis_kelamin, alamat, ruangan, penanggung_biaya, tanggal_masuk) VALUES (?,?,?,?,?,?,?,?,?,?)`,
                    [incidentId, toNull(patient_nama), toNull(patient_no_rm), toNull(patient_tgl_lahir), toNull(patient_kelompok_umur), jk, toNull(patient_alamat), toNull(patient_ruangan), toNull(patient_penanggung_biaya), toNull(patient_tanggal_masuk)]
                );
                console.log(`[DB DEBUG] Patient insert successful`);
            }
            res.json({ success: true, message: is_final ? 'Laporan berhasil dibuat' : 'Draft berhasil disimpan', id: incidentId });
        }
    } catch (err) {
        console.error('[DB ERROR] Exception during submission:', err);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

module.exports = router;