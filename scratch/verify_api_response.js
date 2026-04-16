const axios = require('axios');

async function testAdminApi() {
    try {
        // 1. Login to get token
        console.log("Logging in...");
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            usernameOrEmail: 'admin@gmail.com',
            password: 'admin123'
        });
        
        const token = loginRes.data.token;
        console.log("Token obtained.");

        // 2. Fetch reports
        const res = await axios.get('http://localhost:5000/api/admin/laporan?q=testing', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success && res.data.data.length > 0) {
            const first = res.data.data[0];
            console.log("--- API DATA CHECK ---");
            console.log("Keys found in incident object:", Object.keys(first));
            console.log("patient_nama:", first.patient_nama);
            console.log("nama_pasien:", first.nama_pasien);
        } else {
            console.log("No reports found with 'q=testing'");
        }
    } catch (err) {
        console.error("API Test Error:", err.response ? err.response.data : err.message);
    }
}

testAdminApi();
