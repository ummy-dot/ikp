const axios = require('axios');
(async () => {
  try {
    // Test tanpa login dulu
    const res = await axios.get('http://localhost:3000/admin/api/simgos/001234', {
      validateStatus: () => true // accept any status
    });
    console.log('Status:', res.status);
    console.log('Response:', res.data);
  } catch (e) {
    console.error('Error:', e.message);
  }
})();