const https = require('https');

const DATABASE_URL = 'https://bixfind-3055a-default-rtdb.firebaseio.com';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${DATABASE_URL}/${path}.json`;
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

async function checkDatabase() {
  console.log('Checking Firebase Realtime Database...\n');
  
  // Check websites
  console.log('=== WEBSITES ===');
  const websites = await makeRequest('websites');
  if (websites) {
    const sites = Object.entries(websites);
    console.log(`Found ${sites.length} websites\n`);
    
    for (const [id, site] of sites) {
      console.log(`ID: ${id}`);
      console.log(`  Name: ${site.displayName || site.companyName || 'N/A'}`);
      console.log(`  Published: ${site.isPublished}`);
      console.log(`  Address: ${site.address || 'NOT SET'}`);
      console.log(`  Lat/Lng: ${site.lat ? `${site.lat}, ${site.lng}` : 'NOT SET'}`);
      console.log(`  Phone: ${site.phone || 'N/A'}`);
      console.log(`  Email: ${site.email || 'N/A'}`);
      console.log('');
    }
  } else {
    console.log('No websites found in Firebase\n');
  }
  
  // Check users
  console.log('=== USERS ===');
  const users = await makeRequest('users');
  if (users) {
    const userList = Object.entries(users);
    console.log(`Found ${userList.length} users\n`);
    
    for (const [id, user] of userList) {
      console.log(`ID: ${id}`);
      console.log(`  Name: ${user.fullName || user.businessName || 'N/A'}`);
      console.log(`  Type: ${user.userType || 'N/A'}`);
      console.log(`  Category: ${user.category || 'N/A'}`);
      console.log(`  Address: ${user.address || 'NOT SET'}`);
      console.log('');
    }
  } else {
    console.log('No users found in Firebase\n');
  }
}

checkDatabase().catch(console.error);
