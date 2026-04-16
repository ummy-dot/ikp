const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAdmin } = require('../middleware/auth');

// GET /api/admin/dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const [total] = await db.execute('SELECT COUNT(*) as count FROM incidents');
        const [pending] = await db.execute("SELECT COUNT(*) as count FROM incidents WHERE status='pending'");
        const [reviewed] = await db.execute("SELECT COUNT(*) as count FROM incidents WHERE status='reviewed'");
        const [byGrading] = await db.execute(`
            SELECT grading_risiko, COUNT(*) as count FROM incidents GROUP BY grading_risiko
        `);
        const [byJenis] = await db.execute(`
            SELECT jenis_insiden, COUNT(*) as count FROM incidents GROUP BY jenis_insiden
        `);
        const [byMonth] = await db.execute(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as bulan, COUNT(*) as count
            FROM incidents GROUP BY bulan ORDER BY bulan ASC LIMIT 12
        `);
        const [byAkibat] = await db.execute(`
            SELECT akibat_insiden, COUNT(*) as count FROM incidents GROUP BY akibat_insiden
        `);

        res.json({
            success: true,
            data: {
                total: total[0].count,
                pending: pending[0].count,
                reviewed: reviewed[0].count,
                byGrading,
                byJenis,
                byMonth,
                byAkibat
            }
        });
    } catch (error) {
        console.error('Admin Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error loading admin dashboard stats' });
    }
});

// GET /api/admin/laporan
router.get('/laporan', isAdmin, async (req, res) => {
    try {
        const { grading, jenis, status, q, final, date_from, date_to } = req.query;
        let query = `
            SELECT i.id, i.tanggal_insiden, i.waktu_insiden, i.insiden, i.kronologis, i.jenis_insiden, 
                   i.pelapor_pertama, i.pelapor_pertama_lainnya, i.insiden_terjadi_pada, i.insiden_terjadi_lainnya, 
                   i.menyangkut_pasien, i.menyangkut_lainnya, i.tempat_insiden, i.spesialisasi, i.spesialisasi_lainnya, 
                   i.unit_terkait, i.akibat_insiden, i.tindakan_segera, i.tindakan_oleh, i.tindakan_lainnya, 
                   i.kejadian_serupa, i.detail_serupa, i.pembuat_laporan_file, i.tanda_tangan, i.grading_risiko, 
                   i.status, i.created_by, i.created_at, i.is_final,
                   u.name as pelapor_name, 
                   p.nama_pasien as patient_nama, 
                   p.no_rekam_medik as patient_no_rm, 
                   p.ruangan as patient_ruangan, 
                   p.kelompok_umur as patient_kelompok_umur, 
                   p.jenis_kelamin as patient_jk, 
                   p.penanggung_biaya as patient_penanggung_biaya, 
                   p.tanggal_masuk as patient_tanggal_masuk, 
                   p.tanggal_lahir as patient_tgl_lahir,
                   p.alamat as patient_alamat
            FROM incidents i 
            LEFT JOIN users u ON i.created_by = u.id 
            LEFT JOIN patient_data p ON i.id = p.incident_id
            WHERE 1=1
        `;
        const params = [];
        if (grading) { query += ' AND i.grading_risiko = ?'; params.push(grading); }
        if (jenis) { query += ' AND i.jenis_insiden = ?'; params.push(jenis); }
        if (status) { query += ' AND i.status = ?'; params.push(status); }
        if (final === '1') { query += ' AND i.is_final = 1'; }
        else if (final === '0') { query += ' AND i.is_final = 0'; }
        if (q) { query += ' AND (i.insiden LIKE ? OR i.unit_terkait LIKE ? OR p.nama_pasien LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
        
        if (date_from) { query += ' AND i.tanggal_insiden >= ?'; params.push(date_from); }
        if (date_to) { query += ' AND i.tanggal_insiden <= ?'; params.push(date_to); }
        
        query += ' ORDER BY i.created_at DESC';

        const [incidents] = await db.query(query, params);
        res.json({ success: true, data: incidents });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error loading reports' });
    }
});

// GET /api/admin/laporan/:id
router.get('/laporan/:id', isAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT i.*, u.name as pelapor_name FROM incidents i LEFT JOIN users u ON i.created_by = u.id WHERE i.id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });

        const incident = rows[0];
        const [patientRows] = await db.execute('SELECT * FROM patient_data WHERE incident_id = ?', [req.params.id]);
        
        res.json({ success: true, data: { incident, patient: patientRows[0] || null } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error loading report detail' });
    }
});

// POST /api/admin/laporan/:id/status
router.post('/laporan/:id/status', isAdmin, async (req, res) => {
    try {
        const { status, grading_risiko } = req.body;
        if (grading_risiko) {
            await db.execute('UPDATE incidents SET status = ?, grading_risiko = ? WHERE id = ?', [status, grading_risiko, req.params.id]);
        } else {
            await db.execute('UPDATE incidents SET status = ? WHERE id = ?', [status, req.params.id]);
        }
        res.json({ success: true, message: 'Status laporan diperbarui' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
});

// GET /api/admin/users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, name, username, email, role, created_at FROM users ORDER BY created_at DESC');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error loading users' });
    }
});

// POST /api/admin/users/:id/role
router.post('/users/:id/role', isAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ success: true, message: 'Role user diperbarui' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating user role' });
    }
});

// SIMGOS Mock Lookup (retained)
router.get('/api/simgos/:no_rm', isAdmin, async (req, res) => {
    const no_rm = req.params.no_rm;
    const mockData = {
        '001234': { nama: 'Budi Santoso', no_rm: '001234', ruangan: 'Mawar 2', kelompok_umur: '> 30 tahun - 65 tahun', jenis_kelamin: 'Laki-laki', penanggung_biaya: 'BPJS', tanggal_masuk: '2026-03-01T08:00', tanggal_lahir: '1990-05-15', alamat: 'Jl. Merdeka No. 1, Jakarta' },
        '005678': { nama: 'Siti Rahayu', no_rm: '005678', ruangan: 'Melati 1', kelompok_umur: '> 15 tahun - 30 tahun', jenis_kelamin: 'Perempuan', penanggung_biaya: 'Pribadi', tanggal_masuk: '2026-03-03T10:30', tanggal_lahir: '2000-08-20', alamat: 'Jl. Sudirman No. 10, Bandung' },
        '009999': { nama: 'Ahmad Fauzi', no_rm: '009999', ruangan: 'ICU', kelompok_umur: '> 65 tahun', jenis_kelamin: 'Laki-laki', penanggung_biaya: 'Asuransi Swasta', tanggal_masuk: '2026-02-28T14:00', tanggal_lahir: '1955-03-10', alamat: 'Jl. Gatot Subroto No. 5, Surabaya' },
        '112233': { nama: 'Dewi Lestari', no_rm: '112233', ruangan: 'VK / Bersalin', kelompok_umur: '> 15 tahun - 30 tahun', jenis_kelamin: 'Perempuan', penanggung_biaya: 'BPJS', tanggal_masuk: '2026-03-05T06:00', tanggal_lahir: '1995-12-03', alamat: 'Jl. Diponegoro No. 22, Yogyakarta' },
        '123456': { nama: 'Test Pasien', no_rm: '123456', ruangan: 'Test Ruangan', kelompok_umur: '> 30 tahun - 65 tahun', jenis_kelamin: 'Perempuan', penanggung_biaya: 'BPJS', tanggal_masuk: '2026-03-10T08:00', tanggal_lahir: '1989-12-30', alamat: 'Test Alamat' },
    };

    if (mockData[no_rm]) {
        const d = { ...mockData[no_rm] };
        d.jenis_kelamin = d.jenis_kelamin === 'Laki-laki' ? 'L' : (d.jenis_kelamin === 'Perempuan' ? 'P' : d.jenis_kelamin);
        return res.json({ found: true, data: d });
    }
    const [rows] = await db.execute('SELECT * FROM patient_data WHERE no_rekam_medik = ? LIMIT 1', [no_rm]);
    if (rows.length > 0) {
        const p = rows[0];
        return res.json({
            found: true, data: {
                nama: p.nama_pasien, no_rm: p.no_rekam_medik, ruangan: p.ruangan,
                kelompok_umur: p.kelompok_umur, jenis_kelamin: p.jenis_kelamin,
                penanggung_biaya: p.penanggung_biaya,
                tanggal_masuk: p.tanggal_masuk ? new Date(p.tanggal_masuk).toISOString().slice(0, 16) : ''
            }
        });
    }
    res.json({ found: false });
});

module.exports = router;
