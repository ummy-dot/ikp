// Quick test untuk verify patient_data insert
// Simulate what form submission does

const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

async function testInsert() {
    try {
        console.log('Simulating user form submission with patient data...');
        
        // Prepare form data
        const data = new FormData();
        
        // Incident fields (minimal)
        data.append('tanggal_insiden', '2026-03-11');
        data.append('waktu_insiden', '10:00');
        data.append('insiden', 'Test insiden');
        data.append('kronologis', 'Test kronologis');
        data.append('jenis_insiden', 'Obat');
        data.append('pelapor_pertama', 'Test pelapor');
        data.append('insiden_terjadi_pada', 'Pasien');
        data.append('menyangkut_pasien', 'Ya');
        data.append('tempat_insiden', 'Ruang perawatan');
        data.append('spesialisasi', 'Umum');
        data.append('unit_terkait', 'Test unit');
        data.append('akibat_insiden', 'Tidak ada dampak');
        data.append('tindakan_segera', 'Tidak');
        data.append('tindakan_oleh', 'Test');
        data.append('kejadian_serupa', 'tidak');
        data.append('grading_risiko', 'Rendah');
        data.append('submit_type', 'draft');
        
        // PATIENT DATA (CRITICAL!)
        data.append('patient_nama', 'Budi Santoso');
        data.append('patient_no_rm', '001234');
        data.append('patient_tgl_lahir', '1990-05-15');
        data.append('patient_kelompok_umur', '> 30 tahun - 65 tahun');
        data.append('patient_jk', 'L');
        data.append('patient_alamat', 'Jl. Merdeka No. 1, Jakarta');
        data.append('patient_ruangan', 'Mawar 2');
        data.append('patient_penanggung_biaya', 'BPJS');
        data.append('patient_tanggal_masuk', '2026-03-01T08:00');
        
        console.log('\nForm data to send:');
        console.log('  patient_nama:', 'Budi Santoso');
        console.log('  patient_no_rm:', '001234');
        console.log('  patient_kelompok_umur:', '> 30 tahun - 65 tahun');
        console.log('  patient_jk:', 'L');
        
        // Note: Cannot actually submit without active session, just show what we're trying
        console.log('\n⚠️  This test shows the structure, but need to use browser to test actual session-based submission');
        console.log('Step 1: Open http://localhost:3000/user/form');
        console.log('Step 2: Click "Cari Data" with RM "001234"');
        console.log('Step 3: Fill other required fields');
        console.log('Step 4: Click "Simpan Draft"');
        console.log('Step 5: Check server terminal for [POST /user/form] and [INSERT PATIENT] logs');
        
    } catch (err) {
        console.error('Error:', err.message);
    }
}

testInsert();
