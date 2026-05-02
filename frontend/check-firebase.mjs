import { initializeApp, getApps } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Initialize with service account - you'll need to download this from Firebase Console
// For now, we use application default credentials
initializeApp({
  credential: undefined,
  databaseURL: 'https://bixfind-3055a-default-rtdb.firebaseio.com'
});

async function checkFirebaseData() {
  console.log('=== Firebase Data Check ===\n');
  
  try {
    const db = getDatabase();
    
    // Check users
    console.log('1. Users:');
    const usersSnap = await db.ref('users').get();
    if (usersSnap.exists()) {
      const users = usersSnap.val();
      console.log(JSON.stringify(users, null, 2));
    } else {
      console.log('   No users found');
    }
    
    // Check credentials
    console.log('\n2. User Credentials:');
    const credsSnap = await db.ref('userCredentials').get();
    if (credsSnap.exists()) {
      const creds = credsSnap.val();
      console.log(JSON.stringify(creds, null, 2));
    } else {
      console.log('   No credentials found');
    }
    
    // Check websites
    console.log('\n3. Websites:');
    const webSnap = await db.ref('websites').get();
    if (webSnap.exists()) {
      const sites = webSnap.val();
      console.log('Found', Object.keys(sites).length, 'websites');
      Object.entries(sites).slice(0, 5).forEach(([id, data]: [string, any]) => {
        console.log(`   - ${id}: ${data.companyName || data.displayName || 'No name'}`);
      });
    } else {
      console.log('   No websites found');
    }
    
    // Check homepage
    console.log('\n4. Homepage Snapshot:');
    const homeSnap = await db.ref('homepage').get();
    if (homeSnap.exists()) {
      console.log(JSON.stringify(homeSnap.val(), null, 2));
    } else {
      console.log('   No homepage snapshot found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkFirebaseData();