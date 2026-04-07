const axios = require('axios');
(async () => {
  for (const no of ['001234','005678','009999','112233']) {
    try {
      const res = await axios.get(`http://localhost:3000/admin/api/simgos/${no}`);
      console.log(no, res.data);
    } catch (e) {
      console.error('error', no, e.message);
    }
  }
})();