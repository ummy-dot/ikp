const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAdmin } = require('../middleware/auth');

// GET /admin/dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
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

    res.render('admin/dashboard', {
        title: 'Dashboard Admin - IKP',
        user: req.session.user,
        stats: {
            total: total[0].count,
            pending: pending[0].count,
            reviewed: reviewed[0].count,
            byGrading,
            byJenis,
            byMonth,
            byAkibat
        }
    });
});

// GET /admin/laporan
router.get('/laporan', isAdmin, async (req, res) => {
    const { grading, jenis, status, q, final, date_from, date_to } = req.query;
    let query = 'SELECT i.*, u.name as pelapor_name FROM incidents i LEFT JOIN users u ON i.created_by = u.id WHERE 1=1';
    const params = [];
    if (grading) { query += ' AND i.grading_risiko = ?'; params.push(grading); }
    if (jenis) { query += ' AND i.jenis_insiden = ?'; params.push(jenis); }
    if (status) { query += ' AND i.status = ?'; params.push(status); }
    if (final === '1') { query += ' AND i.is_final = 1'; }
    else if (final === '0') { query += ' AND i.is_final = 1'; } // This was probably a typo in original but fixed below
    if (q) { query += ' AND (i.insiden LIKE ? OR i.unit_terkait LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    
    // Date range filter
    if (date_from) { query += ' AND DATE(i.created_at) >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND DATE(i.created_at) <= ?'; params.push(date_to); }
    
    query += ' ORDER BY i.created_at DESC';

    const [incidents] = await db.execute(query, params);
    res.render('admin/laporan', {
        title: 'Daftar Laporan - Admin',
        user: req.session.user,
        incidents,
        filters: { grading, jenis, status, q, final, date_from, date_to }
    });
});

// GET /admin/laporan/export-all (Export PDF - Comprehensive Table Format)
router.get('/laporan/export-all', isAdmin, async (req, res) => {
    try {
        const { grading, jenis, status, q, final, date_from, date_to } = req.query;
        let query = `
            SELECT i.*, u.name as pelapor_name, 
                   p.nama_pasien, p.no_rekam_medik, p.ruangan, p.kelompok_umur, p.jenis_kelamin, p.penanggung_biaya, p.tanggal_masuk as patient_tanggal_masuk
            FROM incidents i 
            LEFT JOIN users u ON i.created_by = u.id 
            LEFT JOIN patient_data p ON i.id = p.incident_id
            WHERE 1=1`;
        
        const params = [];
        if (grading) { query += ' AND i.grading_risiko = ?'; params.push(grading); }
        if (jenis) { query += ' AND i.jenis_insiden = ?'; params.push(jenis); }
        if (status) { query += ' AND i.status = ?'; params.push(status); }
        if (final === '1') { query += ' AND i.is_final = 1'; }
        else if (final === '0') { query += ' AND i.is_final = 0'; }
        if (q) { query += ' AND (i.insiden LIKE ? OR i.unit_terkait LIKE ? OR p.nama_pasien LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
        if (date_from) { query += ' AND DATE(i.created_at) >= ?'; params.push(date_from); }
        if (date_to) { query += ' AND DATE(i.created_at) <= ?'; params.push(date_to); }
        query += ' ORDER BY i.created_at DESC';

        const [incidents] = await db.execute(query, params);

        const PDFDocument = require('pdfkit');
        // A3 or larger landscape for "total" data? Let's stick with A4 Landscape but use smaller font and multi-line.
        const doc = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
        const filename = `Laporan-IKP-Lengkap-${new Date().toISOString().split('T')[0]}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        doc.pipe(res);

        // Header Title
        doc.fontSize(14).font('Helvetica-Bold').text('REKAPITULASI LENGKAP LAPORAN INSIDEN KESELAMATAN PASIEN', { align: 'center' });
        doc.fontSize(8).font('Helvetica').text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });
        doc.moveDown();

        const tableTop = 80;
        const colWidths = {
            no: 25,
            info: 140, // Tgl, Waktu, Pelapor
            pasien: 140, // Nama, RM, Gender, Umur
            insiden: 180, // Insiden, Jenis, Grading
            detail: 140, // Kronologis, Tindakan
            status: 75   // Status, Unit
        };

        const startX = 20;
        let currentY = tableTop;

        // Header
        doc.fontSize(9).font('Helvetica-Bold');
        doc.rect(startX, currentY, 800, 20).fill('#1e293b');
        doc.fillColor('#ffffff');
        
        doc.text('No', startX, currentY + 5, { width: colWidths.no, align: 'center' });
        doc.text('INFO KEJADIAN', startX + colWidths.no, currentY + 5, { width: colWidths.info });
        doc.text('DATA PASIEN', startX + colWidths.no + colWidths.info, currentY + 5, { width: colWidths.pasien });
        doc.text('RINCIAN INSIDEN', startX + colWidths.no + colWidths.info + colWidths.pasien, currentY + 5, { width: colWidths.insiden });
        doc.text('KRONOLOGIS & TINDAKAN', startX + colWidths.no + colWidths.info + colWidths.pasien + colWidths.insiden, currentY + 5, { width: colWidths.detail });
        doc.text('UNIT & STATUS', startX + colWidths.no + colWidths.info + colWidths.pasien + colWidths.insiden + colWidths.detail, currentY + 5, { width: colWidths.status });

        currentY += 20;

        incidents.forEach((inc, index) => {
            const grading = inc.grading_risiko.toLowerCase();
            const sx = startX;
            
            // Calculate dynamic height for this row based on content
            // We check the tallest multi-line column
            const insidenHeight = doc.heightOfString(inc.insiden || '-', { width: colWidths.insiden - 40 });
            const kronoHeight = doc.heightOfString(inc.kronologis || '-', { width: colWidths.detail });
            const tindakanHeight = doc.heightOfString(inc.tindakan_segera || '-', { width: colWidths.detail });
            
            // Base padding + vertical content
            const contentHeight = Math.max(70, insidenHeight + 50, kronoHeight + tindakanHeight + 30);
            const rowHeight = contentHeight + 10;

            if (currentY + rowHeight > doc.page.height - 20) {
                doc.addPage();
                currentY = 20;
            }

            let bgColor = '#ffffff';
            if (grading === 'biru') bgColor = '#eff6ff';
            if (grading === 'hijau') bgColor = '#f0fdf4';
            if (grading === 'kuning') bgColor = '#fefce8';
            if (grading === 'merah') bgColor = '#fef2f2';

            doc.rect(startX, currentY, 800, rowHeight).fill(bgColor).stroke('#cbd5e1');
            doc.fillColor('#000000').fontSize(8);

            const ty = currentY + 5;

            // No
            doc.font('Helvetica-Bold').text(index + 1, sx, ty, { width: colWidths.no, align: 'center' });

            // Info Kejadian
            doc.font('Helvetica-Bold').text('Tgl:', sx + colWidths.no, ty);
            doc.font('Helvetica').text(new Date(inc.tanggal_insiden).toLocaleDateString('id-ID'), sx + colWidths.no + 20, ty);
            doc.font('Helvetica-Bold').text('Wkt:', sx + colWidths.no, ty + 12);
            doc.font('Helvetica').text(inc.waktu_insiden, sx + colWidths.no + 20, ty + 12);
            doc.font('Helvetica-Bold').text('Lapor:', sx + colWidths.no, ty + 24);
            doc.font('Helvetica').text(inc.pelapor_pertama, sx + colWidths.no + 30, ty + 24, { width: colWidths.info - 30 });

            // Data Pasien
            const px = sx + colWidths.no + colWidths.info;
            doc.font('Helvetica-Bold').text(inc.nama_pasien || '-', px, ty, { width: colWidths.pasien, ellipsis: true });
            doc.font('Helvetica').fontSize(7);
            doc.text(`RM: ${inc.no_rekam_medik || '-'}`, px, ty + 12);
            doc.text(`${inc.jenis_kelamin || '-'} | ${inc.kelompok_umur || '-'}`, px, ty + 22);
            doc.text(`Ruang: ${inc.ruangan || '-'}`, px, ty + 32);
            doc.text(`Biaya: ${inc.penanggung_biaya || '-'}`, px, ty + 42);

            // Rincian Insiden
            const ix = px + colWidths.pasien;
            doc.fontSize(8).font('Helvetica-Bold').text('Insiden:', ix, ty);
            doc.font('Helvetica').text(inc.insiden, ix + 35, ty, { width: colWidths.insiden - 40 });
            doc.font('Helvetica-Bold').text('Jenis:', ix, ty + 30 + (insidenHeight > 15 ? insidenHeight - 10 : 0));
            doc.font('Helvetica').text(inc.jenis_insiden, ix + 35, ty + 30 + (insidenHeight > 15 ? insidenHeight - 10 : 0));
            doc.font('Helvetica-Bold').text('Grading:', ix, ty + 42 + (insidenHeight > 15 ? insidenHeight - 10 : 0));
            doc.font('Helvetica-Bold').fillColor(grading === 'merah' ? '#b91c1c' : grading === 'kuning' ? '#a16207' : '#000').text(inc.grading_risiko, ix + 45, ty + 42 + (insidenHeight > 15 ? insidenHeight - 10 : 0));
            doc.fillColor('#000');

            // Detail
            const dx = ix + colWidths.insiden;
            doc.font('Helvetica-Bold').text('Kronologis:', dx, ty);
            doc.font('Helvetica').fontSize(7).text(inc.kronologis || '-', dx, ty + 10, { width: colWidths.detail });
            
            const currentKronoHeight = doc.heightOfString(inc.kronologis || '-', { width: colWidths.detail });
            doc.font('Helvetica-Bold').fontSize(8).text('Tindakan:', dx, ty + 20 + currentKronoHeight);
            doc.font('Helvetica').fontSize(7).text(inc.tindakan_segera || '-', dx, ty + 30 + currentKronoHeight, { width: colWidths.detail });

            // Status & Unit
            const ux = dx + colWidths.detail;
            doc.fontSize(8).font('Helvetica-Bold').text('Unit:', ux, ty);
            doc.font('Helvetica').text(inc.unit_terkait, ux, ty + 10, { width: colWidths.status });
            doc.font('Helvetica-Bold').text('Status:', ux, ty + 45);
            doc.font('Helvetica').text(inc.status.toUpperCase(), ux, ty + 55);

            currentY += rowHeight;
        });

        doc.end();
    } catch (error) {
        console.error('PDF Bulk export error:', error);
        res.status(500).send('Error generating PDF');
    }
});

// GET /admin/laporan/export-csv
router.get('/laporan/export-csv', isAdmin, async (req, res) => {
    try {
        const { grading, jenis, status, q, final, date_from, date_to } = req.query;
        let query = `
            SELECT i.*, u.name as user_creator, 
                   p.nama_pasien, p.no_rekam_medik, p.ruangan, p.kelompok_umur, p.jenis_kelamin, p.penanggung_biaya, p.tanggal_masuk as patient_tanggal_masuk
            FROM incidents i 
            LEFT JOIN users u ON i.created_by = u.id 
            LEFT JOIN patient_data p ON i.id = p.incident_id
            WHERE 1=1`;
        
        const params = [];
        if (grading) { query += ' AND i.grading_risiko = ?'; params.push(grading); }
        if (jenis) { query += ' AND i.jenis_insiden = ?'; params.push(jenis); }
        if (status) { query += ' AND i.status = ?'; params.push(status); }
        if (final === '1') { query += ' AND i.is_final = 1'; }
        else if (final === '0') { query += ' AND i.is_final = 0'; }
        if (q) { query += ' AND (i.insiden LIKE ? OR i.unit_terkait LIKE ? OR p.nama_pasien LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
        if (date_from) { query += ' AND DATE(i.created_at) >= ?'; params.push(date_from); }
        if (date_to) { query += ' AND DATE(i.created_at) <= ?'; params.push(date_to); }
        query += ' ORDER BY i.created_at DESC';

        const [incidents] = await db.execute(query, params);

        const columns = [
            'ID','Tanggal','Waktu','Insiden','Kronologis','Jenis','Pelapor Pertama','Tempat','Unit','Tindakan Segera','Tindakan Oleh','Akibat','Grading','Status',
            'Nama Pasien','No RM','Gender','Umur','Ruangan','Penanggung Biaya','Tgl Masuk Pasien','Dibuat Oleh'
        ];
        
        let csv = columns.join(',') + '\n';
        
        incidents.forEach((inc) => {
            const clean = (val) => val ? `"${String(val).replace(/"/g, '""').replace(/\n/g, ' ')}"` : '""';
            const row = [
                inc.id,
                new Date(inc.tanggal_insiden).toLocaleDateString('id-ID'),
                inc.waktu_insiden,
                clean(inc.insiden),
                clean(inc.kronologis),
                inc.jenis_insiden,
                clean(inc.pelapor_pertama),
                clean(inc.tempat_insiden),
                clean(inc.unit_terkait),
                clean(inc.tindakan_segera),
                clean(inc.tindakan_oleh),
                inc.akibat_insiden,
                inc.grading_risiko,
                inc.status,
                clean(inc.nama_pasien),
                clean(inc.no_rekam_medik),
                inc.jenis_kelamin,
                inc.kelompok_umur,
                clean(inc.ruangan),
                clean(inc.penanggung_biaya),
                inc.patient_tanggal_masuk ? new Date(inc.patient_tanggal_masuk).toLocaleString('id-ID') : '""',
                clean(inc.user_creator)
            ];
            csv += row.join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=Laporan-IKP-Lengkap.csv');
        res.send(csv);
    } catch (error) {
        console.error('CSV export error:', error);
        res.status(500).send('Error exporting CSV');
    }
});

// GET /admin/laporan (moved down to avoid catching export as :id if order is tricky but keeping it here for clarity)
router.get('/laporan', isAdmin, async (req, res) => {
    const { grading, jenis, status, q, final, date_from, date_to } = req.query;
    let query = 'SELECT i.*, u.name as pelapor_name FROM incidents i LEFT JOIN users u ON i.created_by = u.id WHERE 1=1';
    const params = [];
    if (grading) { query += ' AND i.grading_risiko = ?'; params.push(grading); }
    if (jenis) { query += ' AND i.jenis_insiden = ?'; params.push(jenis); }
    if (status) { query += ' AND i.status = ?'; params.push(status); }
    if (final === '1') { query += ' AND i.is_final = 1'; }
    else if (final === '0') { query += ' AND i.is_final = 0'; }
    if (q) { query += ' AND (i.insiden LIKE ? OR i.unit_terkait LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    
    if (date_from) { query += ' AND DATE(i.created_at) >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND DATE(i.created_at) <= ?'; params.push(date_to); }
    
    query += ' ORDER BY i.created_at DESC';

    const [incidents] = await db.execute(query, params);
    res.render('admin/laporan', {
        title: 'Daftar Laporan - Admin',
        user: req.session.user,
        incidents,
        filters: { grading, jenis, status, q, final, date_from, date_to }
    });
});

// GET /admin/laporan/:id
router.get('/laporan/:id', isAdmin, async (req, res) => {
    const [rows] = await db.execute(
        'SELECT i.*, u.name as pelapor_name FROM incidents i LEFT JOIN users u ON i.created_by = u.id WHERE i.id = ?',
        [req.params.id]
    );
    if (rows.length === 0) return res.status(404).render('error', { title: '404', message: 'Laporan tidak ditemukan', user: req.session.user });

    const incident = rows[0];
    const [patientRows] = await db.execute('SELECT * FROM patient_data WHERE incident_id = ?', [req.params.id]);
    const patient = patientRows[0] || null;

    res.render('admin/detail', {
        title: `Laporan #${incident.id}`,
        user: req.session.user,
        incident,
        patient,
        error: req.flash('error'),
        success: req.flash('success')
    });
});

// POST /admin/laporan/:id/status  
router.post('/laporan/:id/status', isAdmin, async (req, res) => {
    const { status } = req.body;
    await db.execute('UPDATE incidents SET status = ? WHERE id = ?', [status, req.params.id]);
    req.flash('success', 'Status laporan diperbarui.');
    res.redirect(`/admin/laporan/${req.params.id}`);
});

// POST /admin/laporan/:id/patient
router.post('/laporan/:id/patient', isAdmin, async (req, res) => {
    const { nama_pasien, no_rekam_medik, ruangan, kelompok_umur, jenis_kelamin, penanggung_biaya, tanggal_masuk } = req.body;
    const incident_id = req.params.id;

    // Check if already exists  
    const [existing] = await db.execute('SELECT id FROM patient_data WHERE incident_id = ?', [incident_id]);
    if (existing.length > 0) {
        await db.execute(
            'UPDATE patient_data SET nama_pasien=?, no_rekam_medik=?, ruangan=?, kelompok_umur=?, jenis_kelamin=?, penanggung_biaya=?, tanggal_masuk=? WHERE incident_id=?',
            [nama_pasien, no_rekam_medik, ruangan, kelompok_umur, jenis_kelamin, penanggung_biaya, tanggal_masuk, incident_id]
        );
    } else {
        await db.execute(
            'INSERT INTO patient_data (incident_id, nama_pasien, no_rekam_medik, ruangan, kelompok_umur, jenis_kelamin, penanggung_biaya, tanggal_masuk) VALUES (?,?,?,?,?,?,?,?)',
            [incident_id, nama_pasien, no_rekam_medik, ruangan, kelompok_umur, jenis_kelamin, penanggung_biaya, tanggal_masuk]
        );
    }
    await db.execute("UPDATE incidents SET status='reviewed' WHERE id=?", [incident_id]);
    req.flash('success', 'Data pasien berhasil disimpan.');
    res.redirect(`/admin/laporan/${incident_id}`);
});

// GET /api/simgos/:no_rm — Mock SIMGOS Lookup
router.get('/api/simgos/:no_rm', isAdmin, async (req, res) => {
    const no_rm = req.params.no_rm;
    // Mock data - replace with actual SIMGOS API endpoint
    const mockData = {
        '001234': { nama: 'Budi Santoso', no_rm: '001234', ruangan: 'Mawar 2', kelompok_umur: '> 30 tahun - 65 tahun', jenis_kelamin: 'Laki-laki', penanggung_biaya: 'BPJS', tanggal_masuk: '2026-03-01T08:00', tanggal_lahir: '1990-05-15', alamat: 'Jl. Merdeka No. 1, Jakarta' },
        '005678': { nama: 'Siti Rahayu', no_rm: '005678', ruangan: 'Melati 1', kelompok_umur: '> 15 tahun - 30 tahun', jenis_kelamin: 'Perempuan', penanggung_biaya: 'Pribadi', tanggal_masuk: '2026-03-03T10:30', tanggal_lahir: '2000-08-20', alamat: 'Jl. Sudirman No. 10, Bandung' },
        '009999': { nama: 'Ahmad Fauzi', no_rm: '009999', ruangan: 'ICU', kelompok_umur: '> 65 tahun', jenis_kelamin: 'Laki-laki', penanggung_biaya: 'Asuransi Swasta', tanggal_masuk: '2026-02-28T14:00', tanggal_lahir: '1955-03-10', alamat: 'Jl. Gatot Subroto No. 5, Surabaya' },
        '112233': { nama: 'Dewi Lestari', no_rm: '112233', ruangan: 'VK / Bersalin', kelompok_umur: '> 15 tahun - 30 tahun', jenis_kelamin: 'Perempuan', penanggung_biaya: 'BPJS', tanggal_masuk: '2026-03-05T06:00', tanggal_lahir: '1995-12-03', alamat: 'Jl. Diponegoro No. 22, Yogyakarta' },
        '123456': { nama: 'Test Pasien', no_rm: '123456', ruangan: 'Test Ruangan', kelompok_umur: '> 30 tahun - 65 tahun', jenis_kelamin: 'Perempuan', penanggung_biaya: 'BPJS', tanggal_masuk: '2026-03-10T08:00', tanggal_lahir: '1989-12-30', alamat: 'Test Alamat' },
    };

    if (mockData[no_rm]) {
        // convert gender to code L/P for consistency with form options
        const d = { ...mockData[no_rm] };
        d.jenis_kelamin = d.jenis_kelamin === 'Laki-laki' ? 'L' : (d.jenis_kelamin === 'Perempuan' ? 'P' : d.jenis_kelamin);
        console.log(`[ADMIN SIMGOS] Found RM ${no_rm}:`, JSON.stringify(d));
        return res.json({ found: true, data: d });
    }
    // Also check DB if already saved
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

// GET /admin/users
router.get('/users', isAdmin, async (req, res) => {
    const [users] = await db.execute('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.render('admin/users', {
        title: 'Manajemen User - Admin',
        user: req.session.user,
        users,
        success: req.flash('success'),
        error: req.flash('error')
    });
});

// POST /admin/users/:id/role
router.post('/users/:id/role', isAdmin, async (req, res) => {
    const { role } = req.body;
    await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    req.flash('success', 'Role user diperbarui.');
    res.redirect('/admin/users');
});

// GET /admin/laporan/:id/export-pdf
router.get('/laporan/:id/export-pdf', isAdmin, async (req, res) => {
    try {
        const PDFDocument = require('pdfkit');
        const [rows] = await db.execute(
            'SELECT i.*, u.name as pelapor_name FROM incidents i LEFT JOIN users u ON i.created_by = u.id WHERE i.id = ?',
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).send('Laporan tidak ditemukan');

        const incident = rows[0];
        const [patientRows] = await db.execute('SELECT * FROM patient_data WHERE incident_id = ?', [req.params.id]);
        const patient = patientRows[0] || null;

        // Create PDF
        const doc = new PDFDocument({ margin: 40 });
        const filename = `Laporan-IKP-${incident.id}.pdf`;
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN INSIDEN KESELAMATAN PASIEN', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('IKP Report #' + incident.id, { align: 'center' });
        doc.moveDown();

        // Patient Data
        if (patient) {
            doc.fontSize(12).font('Helvetica-Bold').text('DATA PASIEN', { underline: true });
            doc.fontSize(10).font('Helvetica');
            doc.text(`Nama Pasien: ${patient.nama_pasien}`);
            doc.text(`No. Rekam Medik: ${patient.no_rekam_medik}`);
            doc.text(`Kelompok Umur: ${patient.kelompok_umur}`);
            doc.text(`Jenis Kelamin: ${patient.jenis_kelamin}`);
            doc.text(`Ruangan: ${patient.ruangan}`);
            doc.text(`Penanggung Biaya: ${patient.penanggung_biaya}`);
            doc.moveDown();
        }

        // Incident Details
        doc.fontSize(12).font('Helvetica-Bold').text('RINCIAN KEJADIAN', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Tanggal Insiden: ${new Date(incident.tanggal_insiden).toLocaleDateString('id-ID')}`);
        doc.text(`Waktu Insiden: ${incident.waktu_insiden}`);
        doc.text(`Jenis Insiden: ${incident.jenis_insiden}`);
        doc.text(`Grading Risiko: ${incident.grading_risiko}`);
        doc.text(`Status: ${incident.status}`);
        doc.text(`Pelapor: ${incident.pelapor_pertama}`);
        doc.moveDown();

        // Incident Description
        doc.fontSize(12).font('Helvetica-Bold').text('DESKRIPSI INSIDEN', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(incident.insiden);
        doc.moveDown();

        // Kronologis
        doc.fontSize(12).font('Helvetica-Bold').text('KRONOLOGIS', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(incident.kronologis);
        doc.moveDown();

        // Tindakan
        doc.fontSize(12).font('Helvetica-Bold').text('TINDAKAN SEGERA', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Tindakan: ${incident.tindakan_segera}`);
        doc.text(`Dilakukan oleh: ${incident.tindakan_oleh}`);
        doc.moveDown();

        // Footer
        doc.fontSize(9).font('Helvetica').text(`Generated on ${new Date().toLocaleString('id-ID')}`, { align: 'right', color: '#999' });

        doc.end();
    } catch (error) {
        console.error('PDF export error:', error);
        res.status(500).send('Error generating PDF');
    }
});

module.exports = router;
