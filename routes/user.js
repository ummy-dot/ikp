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
// GET /user/dashboard - User Dashboard dengan grafik laporan per bulan
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // Query incidents per bulan untuk user ini
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
        
        // Format data untuk Chart.js
        const chartData = {
            labels: monthlyData.map(d => d.bulan), // Format YYYY-MM
            data: monthlyData.map(d => d.jumlah)
        };
        
        // Get total stats
        const [totalStats] = await db.execute(
            'SELECT COUNT(*) as total, MAX(created_at) as last_report FROM incidents WHERE created_by = ?',
            [userId]
        );
        
        res.render('user/dashboard', {
            chartData: JSON.stringify(chartData),
            totalReports: totalStats[0].total,
            lastReport: totalStats[0].last_report
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// ==================== LOOKUP SIMGOS UNTUK USER ====================
// POST /user/lookup-patient - Mock SIMGOS Integration untuk User
router.post('/lookup-patient', isAuthenticated, async (req, res) => {
    try {
        const { no_rekam_medik } = req.body;
        
        console.log('[LOOKUP-PATIENT] Request received for RM:', no_rekam_medik);

        if (!no_rekam_medik) {
            console.log('[LOOKUP-PATIENT] Empty RM!');
            return res.status(400).json({
                success: false,
                message: 'Nomor Rekam Medik harus diisi'
            });
        }

        // Mock data SIMGOS untuk user - sama seperti di admin
        const mockPatientData = {
            '001234': {
                nama: 'Budi Santoso',
                no_rm: '001234',
                ruangan: 'Mawar 2',
                kelompok_umur: '> 30 tahun - 65 tahun',
                jenis_kelamin: 'Laki-laki',
                penanggung_biaya: 'BPJS',
                tanggal_masuk: '2026-03-01T08:00',
                tanggal_lahir: '1990-05-15',
                alamat: 'Jl. Merdeka No. 1, Jakarta'
            },
            '005678': {
                nama: 'Siti Rahayu',
                no_rm: '005678',
                ruangan: 'Melati 1',
                kelompok_umur: '> 15 tahun - 30 tahun',
                jenis_kelamin: 'Perempuan',
                penanggung_biaya: 'Pribadi',
                tanggal_masuk: '2026-03-03T10:30',
                tanggal_lahir: '2000-08-20',
                alamat: 'Jl. Sudirman No. 10, Bandung'
            },
            '009999': {
                nama: 'Ahmad Fauzi',
                no_rm: '009999',
                ruangan: 'ICU',
                kelompok_umur: '> 65 tahun',
                jenis_kelamin: 'Laki-laki',
                penanggung_biaya: 'Asuransi Swasta',
                tanggal_masuk: '2026-02-28T14:00',
                tanggal_lahir: '1955-03-10',
                alamat: 'Jl. Gatot Subroto No. 5, Surabaya'
            },
            '112233': {
                nama: 'Dewi Lestari',
                no_rm: '112233',
                ruangan: 'VK / Bersalin',
                kelompok_umur: '> 15 tahun - 30 tahun',
                jenis_kelamin: 'Perempuan',
                penanggung_biaya: 'BPJS',
                tanggal_masuk: '2026-03-05T06:00',
                tanggal_lahir: '1995-12-03',
                alamat: 'Jl. Diponegoro No. 22, Yogyakarta'
            },
            '123456': {
                nama: 'Test Pasien',
                no_rm: '123456',
                ruangan: 'Test Ruangan',
                kelompok_umur: '> 30 tahun - 65 tahun',
                jenis_kelamin: 'Perempuan',
                penanggung_biaya: 'BPJS',
                tanggal_masuk: '2026-03-10T08:00',
                tanggal_lahir: '1989-12-30',
                alamat: 'Test Alamat'
            }
        };

        // Cari data pasien berdasarkan No. RM
        const patientData = mockPatientData[no_rekam_medik];

        if (patientData) {
            // Hitung umur dari tanggal lahir
            const birthDate = new Date(patientData.tanggal_lahir);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            // Tentukan kelompok umur berdasarkan umur - MUST MATCH DATABASE ENUM
            let kelompokUmur = '';
            if (age <= 1 && age === 0) kelompokUmur = '0-1 bulan';
            else if (age < 1) kelompokUmur = '> 1 bulan - 1 tahun';
            else if (age <= 5) kelompokUmur = '> 1 tahun - 5 tahun';
            else if (age <= 15) kelompokUmur = '> 5 tahun - 15 tahun';
            else if (age <= 30) kelompokUmur = '> 15 tahun - 30 tahun';
            else if (age <= 65) kelompokUmur = '> 30 tahun - 65 tahun';
            else kelompokUmur = '> 65 tahun';

            const responseData = {
                nama_pasien: patientData.nama,
                no_rekam_medik: patientData.no_rm,
                tanggal_lahir: patientData.tanggal_lahir,
                kelompok_umur: kelompokUmur,
                jenis_kelamin: patientData.jenis_kelamin, // Use full string from mock
                alamat: patientData.alamat,
                ruangan: patientData.ruangan,
                penanggung_biaya: patientData.penanggung_biaya,
                tanggal_masuk: patientData.tanggal_masuk,
                umur: age
            };
            
            console.log('[LOOKUP-PATIENT] Found in mock data, returning:', {
                no_rm: responseData.no_rekam_medik,
                kelompok_umur: responseData.kelompok_umur,
                jenis_kelamin: responseData.jenis_kelamin
            });

            res.json({
                success: true,
                data: responseData
            });
        } else {
            // Cek di database jika sudah ada
            const [rows] = await db.execute('SELECT * FROM patient_data WHERE no_rekam_medik = ? LIMIT 1', [no_rekam_medik]);
            if (rows.length > 0) {
                const p = rows[0];
                res.json({
                    success: true,
                    data: {
                        nama_pasien: p.nama_pasien,
                        no_rekam_medik: p.no_rekam_medik,
                        tanggal_lahir: p.tanggal_lahir,
                        kelompok_umur: p.kelompok_umur,
                        jenis_kelamin: p.jenis_kelamin,
                        alamat: p.alamat,
                        ruangan: p.ruangan,
                        penanggung_biaya: p.penanggung_biaya,
                        tanggal_masuk: p.tanggal_masuk
                    }
                });
            } else {
                res.json({
                    success: false,
                    message: 'Data pasien tidak ditemukan'
                });
            }
        }
    } catch (error) {
        console.error('Error looking up patient:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat lookup data pasien'
        });
    }
});

// ==================== GET FORM LAPORAN ====================
// GET /user/form (Now supports editing) - MODIFIED with patient data
router.get(['/form', '/form/:id'], isAuthenticated, async (req, res) => {
    const id = req.params.id;
    let incident = null;
    let patientData = null;

    if (id) {
        const [rows] = await db.execute('SELECT * FROM incidents WHERE id = ? AND created_by = ?', [id, req.session.user.id]);
        if (rows.length > 0) {
            incident = rows[0];
            // Reliable YYYY-MM-DD comparison
            const createdDate = new Date(incident.created_at).toLocaleDateString('en-CA');
            const todayDate = new Date().toLocaleDateString('en-CA');
            const isToday = createdDate === todayDate;

            if (!isToday || incident.is_final) {
                req.flash('error', 'Laporan ini sudah tidak dapat diedit (sudah final atau beda hari).');
                return res.redirect('/user/riwayat');
            }

            // Ambil data pasien jika ada
            const [patientRows] = await db.execute('SELECT * FROM patient_data WHERE incident_id = ?', [id]);
            if (patientRows.length > 0) {
                patientData = patientRows[0];
            }
        }
    }

    res.render('user/form', {
        title: incident ? 'Edit Laporan IKP' : 'Laporan Insiden Keselamatan Pasien',
        user: req.session.user,
        incident,
        patientData, // Tambahkan data pasien
        error: req.flash('error'),
        success: req.flash('success'),
        isDetail: false
    });
});

// GET /user/form/:id/detail - Read-only detail view
router.get('/form/:id/detail', isAuthenticated, async (req, res) => {
    try {
        const id = req.params.id;
        const [rows] = await db.execute('SELECT * FROM incidents WHERE id = ? AND created_by = ?', [id, req.session.user.id]);
        
        if (rows.length === 0) {
            req.flash('error', 'Laporan tidak ditemukan.');
            return res.redirect('/user/riwayat');
        }

        const incident = rows[0];
        let patientData = null;

        // Ambil data pasien jika ada
        const [patientRows] = await db.execute('SELECT * FROM patient_data WHERE incident_id = ?', [id]);
        if (patientRows.length > 0) {
            patientData = patientRows[0];
        }

        res.render('user/form', {
            title: 'Detail Laporan IKP',
            user: req.session.user,
            incident,
            patientData,
            error: req.flash('error'),
            success: req.flash('success'),
            isDetail: true
        });
    } catch (error) {
        console.error('Detail view error:', error);
        res.status(500).send('Error loading report details');
    }
});

// ==================== POST FORM LAPORAN ====================
// POST /user/form (Now supports New and Update) - MODIFIED with patient data
router.post(['/form', '/form/:id'], isAuthenticated, upload.single('pembuat_laporan_file'), async (req, res) => {
    const id = req.params.id;
    const {
        tanggal_insiden, waktu_insiden, insiden, kronologis, jenis_insiden,
        pelapor_pertama, insiden_terjadi_pada, insiden_terjadi_lainnya,
        menyangkut_pasien, menyangkut_lainnya, tempat_insiden,
        spesialisasi, spesialisasi_lainnya, unit_terkait, akibat_insiden,
        tindakan_segera, tindakan_oleh, tindakan_lainnya,
        kejadian_serupa, detail_serupa, tanda_tangan, grading_risiko,
        submit_type, // 'draft' or 'final'
        // Data pasien dari form
        patient_nama, patient_no_rm, patient_tgl_lahir,
        patient_kelompok_umur, patient_jk, patient_alamat,
        patient_ruangan, patient_penanggung_biaya, patient_tanggal_masuk
    } = req.body;

    // DEBUG: Log data pasien yang diterima
    console.log('[DEBUG-POST] ID:', id);
    console.log('[DEBUG-POST] Submit Type:', submit_type);
    console.log('[DEBUG-POST] Patient data:', {
        patient_nama, patient_no_rm, patient_tgl_lahir,
        patient_kelompok_umur, patient_jk, patient_alamat
    });

    const pembuat_laporan_file = req.file ? req.file.filename : null;
    const serupaVal = kejadian_serupa === 'ya' ? 1 : 0;
    const is_final = submit_type === 'final' ? 1 : 0;

    try {
        if (id) {
            // ========== UPDATE MODE ==========
            const [rows] = await db.execute('SELECT * FROM incidents WHERE id = ? AND created_by = ?', [id, req.session.user.id]);
            if (rows.length === 0) {
                console.error('[DEBUG-UPDATE] Incident NOT FOUND or UNAUTHORIZED:', id);
                throw new Error('Unauthorized or not found');
            }

            const existing = rows[0];
            const createdDate = new Date(existing.created_at).toLocaleDateString('en-CA');
            const todayDate = new Date().toLocaleDateString('en-CA');
            const isToday = createdDate === todayDate;

            if (!isToday || existing.is_final) {
                req.flash('error', 'Update gagal: Laporan sudah terkunci.');
                return res.redirect('/user/riwayat');
            }

            // Update incident
            let sqlArr = [
                'tanggal_insiden=?', 'waktu_insiden=?', 'insiden=?', 'kronologis=?', 'jenis_insiden=?',
                'pelapor_pertama=?', 'insiden_terjadi_pada=?', 'insiden_terjadi_lainnya=?',
                'menyangkut_pasien=?', 'menyangkut_lainnya=?', 'tempat_insiden=?',
                'spesialisasi=?', 'spesialisasi_lainnya=?', 'unit_terkait=?', 'akibat_insiden=?',
                'tindakan_segera=?', 'tindakan_oleh=?', 'tindakan_lainnya=?',
                'kejadian_serupa=?', 'detail_serupa=?', 'is_final=?', 'grading_risiko=?'
            ];
            const params = [
                tanggal_insiden || null, waktu_insiden || null, insiden || null, kronologis || null, jenis_insiden || null,
                pelapor_pertama || null, insiden_terjadi_pada || null, insiden_terjadi_lainnya || null,
                menyangkut_pasien || null, menyangkut_lainnya || null, tempat_insiden || null,
                spesialisasi || null, spesialisasi_lainnya || null, unit_terkait || null, akibat_insiden || null,
                tindakan_segera || null, tindakan_oleh || null, tindakan_lainnya || null,
                serupaVal, detail_serupa || null, is_final, grading_risiko || null
            ];

            if (pembuat_laporan_file) {
                sqlArr.push('pembuat_laporan_file=?');
                params.push(pembuat_laporan_file);
            }
            if (tanda_tangan) {
                sqlArr.push('tanda_tangan=?');
                params.push(tanda_tangan);
            }

            params.push(id);
            await db.execute(`UPDATE incidents SET ${sqlArr.join(', ')} WHERE id=?`, params);

            // Update atau insert data pasien
            if (patient_no_rm) {
                // Convert gender code to ENUM value (handles 'L'/'P' or 'Laki-laki'/'Perempuan')
                const jenis_kelamin_value = (patient_jk === 'L' || patient_jk === 'Laki-laki') ? 'Laki-laki' : 
                                           ((patient_jk === 'P' || patient_jk === 'Perempuan') ? 'Perempuan' : null);
                
                const [existingPatient] = await db.execute('SELECT id FROM patient_data WHERE incident_id = ?', [id]);
                if (existingPatient.length > 0) {
                    await db.execute(
                        `UPDATE patient_data SET 
                         nama_pasien=?, no_rekam_medik=?, tanggal_lahir=?, 
                         kelompok_umur=?, jenis_kelamin=?, alamat=?,
                         ruangan=?, penanggung_biaya=?, tanggal_masuk=?
                         WHERE incident_id=?`,
                        [
                            patient_nama, patient_no_rm, patient_tgl_lahir || null,
                            patient_kelompok_umur, jenis_kelamin_value, patient_alamat,
                            patient_ruangan || null, patient_penanggung_biaya || null,
                            patient_tanggal_masuk || null, id
                        ]
                    );
                } else {
                    await db.execute(
                        `INSERT INTO patient_data 
                         (incident_id, nama_pasien, no_rekam_medik, tanggal_lahir, 
                          kelompok_umur, jenis_kelamin, alamat, ruangan, 
                          penanggung_biaya, tanggal_masuk) 
                         VALUES (?,?,?,?,?,?,?,?,?,?)`,
                        [
                            id, patient_nama, patient_no_rm, patient_tgl_lahir || null,
                            patient_kelompok_umur, jenis_kelamin_value, patient_alamat,
                            patient_ruangan || null, patient_penanggung_biaya || null,
                            patient_tanggal_masuk || null
                        ]
                    );
                }
            }

            req.flash('success', is_final ? 'Laporan TERKIRIM (Final).' : 'Draft laporan diperbarui.');
        } else {
            // ========== INSERT MODE ==========
            const connection = await db.getConnection();
            await connection.beginTransaction();

            try {
                // Insert incident
                const [result] = await connection.execute(`
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
                    tanggal_insiden || null, waktu_insiden || null, insiden || null, kronologis || null, jenis_insiden || null,
                    pelapor_pertama || null, insiden_terjadi_pada || null, insiden_terjadi_lainnya || null,
                    menyangkut_pasien || null, menyangkut_lainnya || null, tempat_insiden || null,
                    spesialisasi || null, spesialisasi_lainnya || null, unit_terkait || null, akibat_insiden || null,
                    tindakan_segera || null, tindakan_oleh || null, tindakan_lainnya || null,
                    serupaVal, detail_serupa || null, pembuat_laporan_file || null, tanda_tangan || null,
                    grading_risiko || null, req.session.user.id, is_final
                ]);

                const incidentId = result.insertId;

                // Insert patient data if available
                if (patient_no_rm) {
                    // Convert gender code to ENUM value (handles 'L'/'P' or 'Laki-laki'/'Perempuan')
                    const jenis_kelamin_value = (patient_jk === 'L' || patient_jk === 'Laki-laki') ? 'Laki-laki' : 
                                               ((patient_jk === 'P' || patient_jk === 'Perempuan') ? 'Perempuan' : null);
                    
                    console.log('[INSERT PATIENT] About to insert with:', {
                        incidentId,
                        patient_nama,
                        patient_no_rm,
                        patient_tgl_lahir,
                        patient_kelompok_umur,
                        patient_jk,
                        jenis_kelamin_value,
                        patient_alamat,
                        patient_ruangan,
                        patient_penanggung_biaya,
                        patient_tanggal_masuk
                    });
                    const result = await connection.execute(
                        `INSERT INTO patient_data 
                         (incident_id, nama_pasien, no_rekam_medik, tanggal_lahir, 
                          kelompok_umur, jenis_kelamin, alamat, ruangan, 
                          penanggung_biaya, tanggal_masuk) 
                         VALUES (?,?,?,?,?,?,?,?,?,?)`,
                        [
                            incidentId, patient_nama, patient_no_rm, patient_tgl_lahir || null,
                            patient_kelompok_umur, jenis_kelamin_value, patient_alamat,
                            patient_ruangan || null, patient_penanggung_biaya || null,
                            patient_tanggal_masuk || null
                        ]
                    );
                    console.log('[INSERT PATIENT] Result:', result[0]);
                } else {
                    console.log('[INSERT PATIENT] SKIPPED - patient_no_rm is empty!');
                }

                await connection.commit();
                connection.release();

                req.flash('success', is_final ? 'Laporan berhasil terkirim secara FINAL!' : 'Laporan disimpan sebagai DRAFT.');
            } catch (err) {
                await connection.rollback();
                connection.release();
                throw err;
            }
        }

        res.redirect('/user/riwayat');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Terjadi kesalahan sistem.');
        res.redirect('/user/riwayat');
    }
});

// ==================== FINALIZE LAPORAN ====================
// POST /user/final/:id (Shortcut to finalize from list)
router.post('/final/:id', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT created_at, is_final FROM incidents WHERE id = ? AND created_by = ?', [req.params.id, req.session.user.id]);
        if (rows.length === 0) return res.redirect('/user/riwayat');

        const incident = rows[0];
        const createdDate = new Date(incident.created_at).toLocaleDateString('en-CA');
        const todayDate = new Date().toLocaleDateString('en-CA');
        const isToday = createdDate === todayDate;

        if (isToday && !incident.is_final) {
            await db.execute('UPDATE incidents SET is_final = 1 WHERE id = ?', [req.params.id]);
            req.flash('success', 'Laporan berhasil di-Finalisasi.');
        } else {
            req.flash('error', 'Laporan tidak bisa di-finalisasi.');
        }
    } catch (e) { console.error(e); }
    res.redirect('/user/riwayat');
});

// ==================== RIWAYAT LAPORAN ====================
// GET /user/riwayat
router.get('/riwayat', isAuthenticated, async (req, res) => {
    const [incidents] = await db.execute(
        'SELECT *, DATE(created_at) as date_only FROM incidents WHERE created_by = ? ORDER BY created_at DESC',
        [req.session.user.id]
    );

    const todayDate = new Date().toLocaleDateString('en-CA');
    const processed = incidents.map(i => {
        const createdDate = new Date(i.created_at).toLocaleDateString('en-CA');
        i.is_today = (createdDate === todayDate);
        return i;
    });

    res.render('user/riwayat', {
        title: 'Riwayat Laporan IKP',
        user: req.session.user,
        incidents: processed,
        success: req.flash('success'),
        error: req.flash('error')
    });
});

// ==================== AMBIL DATA PASIEN ====================
// GET /user/patient/:incident_id - Ambil data pasien untuk incident tertentu
router.get('/patient/:incident_id', isAuthenticated, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT * FROM patient_data WHERE incident_id = ?',
            [req.params.incident_id]
        );

        if (rows.length > 0) {
            res.json({ success: true, data: rows[0] });
        } else {
            res.json({ success: false, message: 'Data pasien tidak ditemukan' });
        }
    } catch (error) {
        console.error('Error fetching patient data:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;