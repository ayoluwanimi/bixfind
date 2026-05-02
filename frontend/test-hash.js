const crypto = require('crypto');
const password = 'Test1234';
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log('Hash:', hash);