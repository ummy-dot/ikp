const http = require('http');

// Simulate lookup request
const postData = JSON.stringify({ no_rekam_medik: '001234' });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/user/lookup-patient',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': 'connect.sid=test' // Won't work without real session, but let's try
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('Endpoint Response:');
            console.log(JSON.stringify(response, null, 2));
            
            if (response.data) {
                console.log('\n=== Data Breakdown ===');
                console.log('nama_pasien:', response.data.nama_pasien);
                console.log('no_rekam_medik:', response.data.no_rekam_medik);
                console.log('kelompok_umur:', response.data.kelompok_umur);
                console.log('jenis_kelamin:', response.data.jenis_kelamin);
                console.log('tanggal_lahir:', response.data.tanggal_lahir);
            }
        } catch (e) {
            console.error('Error parsing response:', e.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error.message);
});

req.write(postData);
req.end();
