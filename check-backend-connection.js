// Simple script to test backend connection from Node.js
const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 8000,
  path: '/health/',
  method: 'GET',
  timeout: 5000
};

console.log('Checking backend server connection...\n');

const req = http.request(options, (res) => {
  console.log(`✅ Backend server is RUNNING!`);
  console.log(`   Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`   Response: ${data}`);
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Backend server is NOT running or not accessible');
  console.error(`   Error: ${error.message}`);
  console.error('\nTo start the backend server:');
  console.error('   1. Open a terminal in the backend directory');
  console.error('   2. Run: python manage.py runserver 8000');
  console.error('   3. Or use: .\\START_BACKEND.ps1');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Connection timeout - backend server is not responding');
  req.destroy();
  process.exit(1);
});

req.end();






