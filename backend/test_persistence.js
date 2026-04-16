const axios = require('axios');

async function testSubmit() {
    try {
        console.log('Logging in...');
        const login = await axios.post('http://localhost:3000/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        
        const token = login.data.token;
        console.log('Login successful, token retrieved.');

        console.log('Sending test report...');
        const res = await axios.post('http://localhost:3000/api/user/incidents', {
            insiden: 'Test Debug Reporting',
            pelapor_pertama: 'Lainnya',
            pelapor_pertama_lainnya: 'Debug Reporter Value',
            tanggal_insiden: '2026-04-16',
            waktu_insiden: '10:00',
            submit_type: 'draft'
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response:', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

testSubmit();
