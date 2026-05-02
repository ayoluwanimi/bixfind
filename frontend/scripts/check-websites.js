const https = require('https');

console.log('Checking websites API...\n');

https.get('https://api-eal2ibekhq-uc.a.run.app/websites', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
  });
}).on('error', e => console.log('Error:', e));
