const admin = require('firebase-admin');
const path = require('path');

async function initFirebase() {
  const serviceAccount = require('./service-account.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://bixfind-3055a-default-rtdb.firebaseio.com'
  });
  
  return admin.database();
}

async function deleteAllWebsites() {
  const db = await initFirebase();
  
  console.log('Connecting to Firebase...');
  
  // Delete all websites
  const websitesRef = db.ref('websites');
  const websitesSnapshot = await websitesRef.once('value');
  const websites = websitesSnapshot.val();
  
  if (websites) {
    const websiteIds = Object.keys(websites);
    console.log(`Found ${websiteIds.length} websites to delete...`);
    
    // Delete each website
    for (const id of websiteIds) {
      await db.ref(`websites/${id}`).remove();
      console.log(`Deleted website: ${id}`);
    }
    
    console.log(`Successfully deleted ${websiteIds.length} websites`);
  } else {
    console.log('No websites found to delete');
  }
  
  // Also clear any mini websites cache
  console.log('\nClearing localStorage cache references...');
  console.log('(Users will need to clear their browser cache)');
  
  process.exit(0);
}

deleteAllWebsites().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
