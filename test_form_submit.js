const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Simulate browser session
const cookieJar = require('axios-cookie-jar-support').default;
const tough = require('tough-cookie');

const instance = axios.create();
instance.defaults.jar = new tough.CookieJar();
cookieJar(instance);

async function testFlow() {
    try {
        const baseURL = 'http://localhost:3000';
        
        console.log('=== Step 1: Register/Login User ===');
        // Try to login with admin
        const loginRes = await instance.post(`${baseURL}/auth/login`, {
            email: 'test@ikp.rs',
            password: 'test123'
        }, { 
            maxRedirects: 0,
            validateStatus: () => true 
        });
        
        if (loginRes.status === 302 || loginRes.status === 200) {
            console.log('✓ Login attempt done (status:', loginRes.status + ')');
        } else {
            console.log('! Login response:', loginRes.status);
        }

        console.log('\n=== Step 2: Submit Lookup ===');
        const lookupRes = await instance.post(`${baseURL}/user/lookup-patient`, {
            no_rekam_medik: '001234'
        });
        
        console.log('✓ Lookup response:', {
            success: lookupRes.data.success,
            nama: lookupRes.data.data?.nama_pasien,
            kelompok_umur: lookupRes.data.data?.kelompok_umur,
            jenis_kelamin: lookupRes.data.data?.jenis_kelamin
        });

        console.log('\n=== Step 3: Submit Form ===');
        const form = new FormData();
        
        // Incident data (minimal required)
        form.append('tanggal_insiden', '2026-03-11');
        form.append('waktu_insiden', '14:00');
        form.append('insiden', 'Test insiden 123');
        form.append('kronologis', 'Test kronologis');
        form.append('jenis_insiden', 'KNC');
        form.append('pelapor_pertama', 'Test Pelapor');
        form.append('insiden_terjadi_pada', 'Pasien');
        form.append('menyangkut_pasien', 'Ya');
        form.append('tempat_insiden', 'Ruang Perawatan');
        form.append('spesialisasi', 'Umum');
        form.append('unit_terkait', 'Test Unit');
        form.append('akibat_insiden', 'Tidak ada cedera');
        form.append('tindakan_segera', 'test');
        form.append('tindakan_oleh', 'test');
        form.append('kejadian_serupa', 'tidak');
        form.append('grading_risiko', 'Biru');
        form.append('submit_type', 'draft');
        
        // Patient data
        form.append('patient_nama', 'Budi Santoso');
        form.append('patient_no_rm', '001234');
        form.append('patient_tgl_lahir', '1990-05-15');
        form.append('patient_kelompok_umur', '> 30 tahun - 65 tahun');
        form.append('patient_jk', 'L');
        form.append('patient_alamat', 'Jl. Merdeka No. 1, Jakarta');
        form.append('patient_ruangan', 'Mawar 2');
        form.append('patient_penanggung_biaya', 'BPJS');
        form.append('patient_tanggal_masuk', '2026-03-01T08:00');
        
        const submitRes = await instance.post(`${baseURL}/user/form`, form, {
            headers: form.getHeaders(),
            maxRedirects: 0,
            validateStatus: () => true
        });
        
        console.log('✓ Form submission status:', submitRes.status);
        if (submitRes.status === 302 || submitRes.status === 200) {
            console.log('✓ Form submitted successfully!');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.status, error.response.data?.message);
        }
    }
}

console.log('Note: This test requires authenticated session.');
console.log('Make sure a user account exists to login.\n');

testFlow();
