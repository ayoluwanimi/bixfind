const axios = require('axios');

// Firebase REST API to check existing data
const FIREBASE_DB = 'https://bixfind-3055a-default-rtdb.firebaseio.com';

async function checkFirebaseData() {
  console.log('=== Checking Firebase Data ===\n');

  try {
    // Check users
    console.log('1. Checking /users...');
    const usersRes = await axios.get(`${FIREBASE_DB}/users.json`);
    if (usersRes.data) {
      const users = Object.entries(usersRes.data);
      console.log(`   Found ${users.length} users:`);
      users.forEach(([id, user]) => {
        console.log(`   - ${id}: ${user.email || user.name || 'No email'} (role: ${user.role || 'unknown'})`);
      });
    } else {
      console.log('   No users found');
    }
    console.log();

    // Check userCredentials
    console.log('2. Checking /userCredentials...');
    const credsRes = await axios.get(`${FIREBASE_DB}/userCredentials.json`);
    if (credsRes.data) {
      const creds = Object.entries(credsRes.data);
      console.log(`   Found ${creds.length} credentials:`);
      creds.forEach(([emailKey, cred]) => {
        console.log(`   - ${emailKey}: userId=${cred.userId}`);
      });
    } else {
      console.log('   No credentials found');
    }
    console.log();

    // Check websites
    console.log('3. Checking /websites...');
    const websitesRes = await axios.get(`${FIREBASE_DB}/websites.json`);
    if (websitesRes.data) {
      const websites = Object.entries(websitesRes.data);
      console.log(`   Found ${websites.length} websites:`);
      websites.slice(0, 10).forEach(([id, site]) => {
        console.log(`   - ${id}: ${site.companyName || site.displayName || 'No name'} (published: ${site.isPublished || false})`);
      });
      if (websites.length > 10) {
        console.log(`   ... and ${websites.length - 10} more`);
      }
    } else {
      console.log('   No websites found');
    }
    console.log();

    // Check homepage snapshot
    console.log('4. Checking /homepage...');
    const homeRes = await axios.get(`${FIREBASE_DB}/homepage.json`);
    if (homeRes.data) {
      console.log('   Homepage snapshot exists');
      console.log('   Stats:', homeRes.data);
    } else {
      console.log('   No homepage snapshot found');
    }

  } catch (error) {
    console.error('Error checking Firebase:', error.message);
  }
}

checkFirebaseData();