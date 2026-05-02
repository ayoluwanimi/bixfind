const https = require('https');

console.log('Analyzing websites...\n');

https.get('https://api-eal2ibekhq-uc.a.run.app/websites', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      const websites = response.websites || [];
      
      console.log(`Total websites: ${websites.length}\n`);
      
      // Filter published websites
      const published = websites.filter(w => w.isPublished);
      console.log(`Published websites: ${published.length}\n`);
      
      // Show all published websites
      console.log('=== PUBLISHED WEBSITES ===\n');
      published.forEach((site, i) => {
        console.log(`${i + 1}. ${site.displayName || site.companyName}`);
        console.log(`   Address: ${site.address || 'NOT SET'}`);
        console.log(`   Phone: ${site.phone || 'NOT SET'}`);
        console.log(`   Email: ${site.email || 'NOT SET'}`);
        console.log(`   Slug: ${site.companyName}`);
        console.log('');
      });
      
      // Count with addresses
      const withAddresses = published.filter(w => w.address && w.address.trim() !== '');
      console.log(`Published websites WITH addresses: ${withAddresses.length}\n`);
      
      if (withAddresses.length > 0) {
        console.log('=== PROVIDERS WITH ADDRESSES ===\n');
        withAddresses.forEach((site, i) => {
          console.log(`${i + 1}. ${site.displayName || site.companyName}`);
          console.log(`   Address: ${site.address}`);
          console.log('');
        });
      }
    } catch (e) {
      console.log('Parse error:', e.message);
    }
  });
}).on('error', e => console.log('Error:', e));
