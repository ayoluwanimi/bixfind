const https = require('https');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function checkAPI() {
  console.log('Checking API for users...\n');
  
  try {
    const response = await makeRequest('https://api-eal2ibekhq-uc.a.run.app/users');
    console.log('API Response:', JSON.stringify(response, null, 2));
  } catch (e) {
    console.log('API Error:', e.message);
  }
}

checkAPI().catch(console.error);
