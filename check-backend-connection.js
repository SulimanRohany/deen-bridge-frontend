// Simple script to test backend connection from Node.js
const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 8000,
  path: '/health/',
  method: 'GET',
  timeout: 5000
};


const req = http.request(options, (res) => {
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    process.exit(0);
  });
});

req.on('error', (error) => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();






